---
title: I accidentally built a form library
date: 2019-01-02
---

This is a story about how I accidentally built another form library for React, and about how that library works, and about how React context works. Like so many things in the late 2010s, it starts with a podcast.

I've been listening to [the Slashfilmcast]() for almost 10 years. I even joined _a Slack community_ that revolves around that podcast so I can talk to other listeners about the movies and TV shows I see by myself because I'm over 30 and I never had much luck making long-lasting friends. Anyway, old episodes of this podcast are a bit hard to find, so over the holiday break, I thought I'd take a run at indexing them using Elasticsearch.

Oh, right, I should back up. I recently took a job at [Elastic](https://www.elastic.co) and I've been wanting to get more familiar with our main product, Elasticsearch, a powerful search index database. I thought I'd add the episodes, along with some metadata, to an Elasticsearch index to make them easy to find. To do that, I'd need a way to enter information about each episode. "Not a problem!" I thought, excitedly! I know how to build a web UI! All I need is a little React app and ... a form.

It sounds so easy, just a few inputs and a submit button, right? So why are the popular libraries so large and complicated? Maybe I should just, you know, throw something small and simple together myself. How hard can it be?

## How to build a form

As a baseline, I just need an input to keep track of value state internally, and a form wrapper that handles submitting all of those values. The input:

```js
class TextInput extends React.Component {
  state = {
    value: ""
  };

  onChange = event => {
    this.setState({ value: event.target.value });
  };

  render() {
    return (
      <input
        type="text"
        {...this.props}
        value={this.state.value}
        onChange={this.onChange}
      />
    );
  }
}
```

And the form:

```js
class Form extends React.Component {
  handleSubmit = e => {
    e.preventDefault();
    const values = extractFormData(e.target);
    this.props.onSubmit && this.props.onSubmit(values);
  };

  render() {
    return <form onSubmit={this.handleSubmit}>{this.props.children}</form>;
  }
}
```

To keep it simple, we can just use the browser's form APIs. The `extractFormData` function used here looks like this:

```js
function extractFormData(target) {
  const FD = new FormData(target);
  return Array.from(FD).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}
```

It uses [the `FormData` API](https://developer.mozilla.org/en-US/docs/Web/API/FormData) to pull all of the values out of the current form context. Using these two components together is pretty simple, too:

```jsx
<Form onSubmit={values => console.log(JSON.stringify(values, null, 2))}>
  <TextInput name="email" placeholder="Your Email" />
  <button type="submit">Submit</button>
</Form>
```

[Play with this form on codesandbox.io](https://codesandbox.io/s/5w70l3vqnn)

![simple form 01](/assets/images/simple-form-01.png)

Submitting this simple form will print the following to the console:

```json
{
  "email": "me@example.com"
}
```

Now we can easily abstract the input state-management to make other kinds of inputs easier to create. Instead of directly building a text input, we'll move the logic into a base input, and then build a basic text input and a textarea input that both use the base.

```jsx
class BaseInput extends React.Component {
  state = {
    value: ""
  };

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  render() {
    return (
      this.props.render({
        value={this.state.value}
        onChange={this.handleChange}
      });
    );
  }
}

function TextInput(props) {
  return (
    <BaseInput render={({ value, onChange }) => (
      <input
        type="text"
        value={value}
        onChange={onChange}
        {...props}
      />
    )} />
  );
}

function TextArea(props) {
  return (
    <BaseInput render={({ value, onChange }) => (
      <textarea
        value={value}
        onChange={onChange}
        {...props}
      />
    )} />
  )
}
```

This is all you need! Unless you care about making sure your values are valid. (You do.)

## Validation styles

Some of the other small form libraries I've seen available on npm leave validation up to you, which seems ... wrong? Validation is a pretty key part of formness, in my opinion. To validate an input, we need to add some logic to the base input.

```jsx
class BaseInput extends React.Component {
  state = {
    value: "",
    valid: true
  };

  handleChange = event => {
    this.setState({ value: event.target.value }, this.checkValidity);
  };

  checkValidity = () => {
    const { validators = [] } = this.props;
    if (this.props.validators.length === 0) {
      return;
    }
    const failed = validators.find((validate) => validate(this.state.value));
    if (failed) {
      this.setState({ valid: false, errorMessage: failed(this.state.value) });
    }
  }

  render() {
    return (
      this.props.render({
        value={this.state.value}
        onChange={this.handleChange}
        valid={this.state.valid}
        errorMessage={this.state.errorMessage}
      });
    );
  }
}
```

This validation strategy is a conventional one where validation functions return null/undefined if the value is valid, or a string error message if the value is invalid. You could create a "required" validator easily this way.

```jsx
const required = value => (value === "" ? "This value is required" : null);

return <TextInput name="email" placeholder="email" validators={[required]} />;
```

As long as `TextInput` passes along the validators to the `BaseInput` internally, it can then check the given `valid` and `errorMessage` props to handle when the input is invalid. Unfortunately, we probably don't want to check validity on every change, but instead on initial mount, and then on the input's "blur" event.

```jsx
class BaseInput extends React.Component {
  state = {
    value: "",
    valid: true
  };

  componentDidMount() {
    this.checkValidity();
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  handleBlur = event => {
    this.checkValidity();
  }

  checkValidity = () => {
    const { validators = [] } = this.props;
    if (this.props.validators.length === 0) {
      return;
    }
    const failed = validators.find((validate) => validate(this.state.value));
    if (failed) {
      this.setState({ valid: false, errorMessage: failed(this.state.value) });
    }
  }

  render() {
    return (
      this.props.render({
        value={this.state.value}
        valid={this.state.valid}
        errorMessage={this.state.errorMessage}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
      });
    );
  }
}
```

To round out validity, we need to account for when an input has been "touched", and when it's "active". We usually don't want to display the error state unless the input has been touched and the input is not currently active.

```jsx
class BaseInput extends React.Component {
  state = {
    value: "",
    valid: true,
    touched: false,
    active: false
  };

  componentDidMount() {
    this.checkValidity();
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  handleFocus = event => {
    this.setState({ active: true, touched: true });
  }

  handleBlur = event => {
    this.setState({ active: false }, this.checkValidity);
  }

  checkValidity = () => {
    const { validators = [] } = this.props;
    if (this.props.validators.length === 0) {
      return;
    }
    const failed = validators.find((validate) => validate(this.state.value));
    if (failed) {
      this.setState({ valid: false, errorMessage: failed(this.state.value) });
    }
  }

  render() {
    return (
      this.props.render({
        value={this.state.value}
        valid={this.state.valid}
        active={this.state.active}
        touched={this.state.touched}
        errorMessage={this.state.errorMessage}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
      });
    );
  }
}
```

We can provide some basic CSS hooks for styling if we add some classes around the input based on the current state. To do this, we'll use the [`classnames`](https://github.com/JedWatson/classnames) library.

```jsx
// in BaseInput
render() {
  const classes = classnames({
    "form-inactive": !this.state.active,
    "form-touched": this.state.touched,
    "form-invalid": !this.state.valid
  });

  return (
    <span className={classes}>
      {this.props.render({
        value={this.state.value}
        valid={this.state.valid}
        active={this.state.active}
        touched={this.state.touched}
        errorMessage={this.state.errorMessage}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
      })}
    </span>
  );
}
```

This solves validation from a styling perspective. Each input can display an error message, change its border color, etc. if it's in a specific invalid/touched/active state. But the _form itself_ still has no idea if any of its values are invalid, and it currently can't get a hold of the validation functions assigned to each input, either. If we want to prevent the form from submitting while any of its values are invalid, we're going to have to change course.

## Switching to React context

The only way for the form to know about the validity of all of its input children is to keep track of validity at the top level. Which means we'll need to provide that validity state back to the inputs, as well as an `onValidityChange` method for the inputs to call to set that state. To do this, we'll need to use React's context API.

```jsx
const FormContext = React.createContext({});
const FormConsumer = FormContext.Consumer;

class Form extends React.Component {
  state = {
    validity: {}
  };

  handleSubmit = e => {
    e.preventDefault();
    const values = extractFormData(e.target);
    this.props.onSubmit && this.props.onSubmit(values);
  };

  handleValidityChange = change => {
    this.setState({ validity: { ...this.state.validity, ...change }});
  };

  render() {
    return (
      <FormContext.Provider
        value={{
          validity: this.state.validity,
          onValidityChange={this.handleValidityChange}
        }}
      >
        <form onSubmit={this.handleSubmit}>{this.props.children}</form>
      </FormContext.Provider>
    );
  }
}
```

Then in the `BaseInput`, we have to use this new function. If we hadn't used context and made `onValidityChange` some kind of render prop, you would have to pass that method and the validity object down through every input. By making it available on a context provider, we can now use the context consumer as far down in the tree as we want, like in the `BaseInput`, for example.

```jsx
// in BaseInput
render() {
  return (
    <FormConsumer>
      {(form) => {
        const valid = !form.validity[this.props.name];
        const classes = classnames({
          "form-inactive": !this.state.active,
          "form-touched": this.state.touched,
          "form-invalid": !valid
        });
        return (
          <span className={classes}>
            {this.props.render({
              value={this.state.value}
              valid={valid}
              active={this.state.active}
              touched={this.state.touched}
              errorMessage={this.state.errorMessage}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              onFocus={this.handleFocus}
            })}
          </span>
        )
      }}
    </FormConsumer>
  );
}
```

A React context consumer uses the "children as function" pattern, which is why you see that function directly inside the `FormConsumer`. The `form` value _provided_ there is the `value` that's being set in the provider above, currently containing `validity` and `onValidityChange`. However, when we use the consumer directly like this, we only have access to the provided values within the render function, and we need the `onValidityChange` function outside of render. A small `withForm` convenience wrapper will give us `this.props.form` so we can access those values throughout the component.

```jsx
const withForm = (Component) => (props) => <FormConsumer>{(form) => <Component {...props} form={form} />}</FormConsumer>;

class BaseInput extends React.Component {
  state = {
    value: "",
    touched: false,
    active: false
  };

  componentDidMount() {
    this.checkValidity();
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  handleFocus = event => {
    this.setState({ active: true, touched: true });
  }

  handleBlur = event => {
    this.setState({ active: false }, this.checkValidity);
  }

  checkValidity = () => {
    const { validators = [] } = this.props;
    if (this.props.validators.length === 0) {
      return;
    }
    const failed = validators.find((validate) => validate(this.state.value));
    if (failed) {
      this.props.form.onValidityChange({ [this.props.name]: false });
      this.setState({ errorMessage: failed(this.state.value) });
    }
  }

  render() {
    return (
      this.props.render({
        value={this.state.value}
        valid={!this.props.form.validity[this.props.name]}
        active={this.state.active}
        touched={this.state.touched}
        errorMessage={this.state.errorMessage}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
      });
    );
  }
}

// use withForm helper to make `this.props.form` available
const BaseInput = withForm(BaseInputView);
```

And now we can block submissions if the form is in an "invalid" state!

```jsx
// in Form
handleSubmit = e => {
  e.preventDefault();
  if (
    Object.keys(this.state.validity).some(
      key => this.state.validity[key] === false
    )
  ) {
    return;
  }
  const values = extractFormData(e.target);
  this.props.onSubmit && this.props.onSubmit(values);
};
```

If we're storing validity in the form, there's no reason not to store the values there too.

```jsx
const FormContext = React.createContext({});
const FormConsumer = FormContext.Consumer;

class Form extends React.Component {
  state = {
    values: {},
    validity: {},
    submitted: false
  };

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ submitted: true });
    if (Object.keys(this.state.validity).some((key) => this.state.validity[key] === false)) {
      return;
    }
    this.props.onSubmit && this.props.onSubmit(this.state.values);
  };

  handleChange = change => {
    this.setState({ values: { ...this.state.values, ...change }});
  }

  handleValidityChange = change => {
    this.setState({ validity: { ...this.state.validity, ...change }});
  };

  render() {
    const classes = classnames({
      "form-submitted": this.state.submitted
    });

    return (
      <FormContext.Provider
        value={{
          values: this.state.values,
          validity: this.state.validity,
          onChange: this.state.handleChange,
          onValidityChange={this.handleValidityChange},
          submitted: this.state.submitted
        }}
      >
        <form className={classes} onSubmit={this.handleSubmit}>{this.props.children}</form>
      </FormContext.Provider>
    );
  }
}
```

We also added a "submitted" state to the form, and a corresponding class. This lets us display errors for fields even if they haven't been blurred. Then in the BaseInput, we'll use the form's onChange instead of our local one.

```jsx
class BaseInput extends React.Component {
  state = {
    touched: false,
    active: false
  };

  componentDidMount() {
    this.checkValidity();
  }

  handleChange = event => {
    this.props.form.onChange({ [this.props.name]: event.target.value });
  };

  handleFocus = event => {
    this.setState({ active: true, touched: true });
  }

  handleBlur = event => {
    this.setState({ active: false }, this.checkValidity);
  }

  checkValidity = () => {
    const { validators = [] } = this.props;
    if (this.props.validators.length === 0) {
      return;
    }
    const failed = validators.find((validate) => validate(this.state.value));
    if (failed) {
      this.props.form.onValidityChange({ [this.props.name]: false });
      this.setState({ errorMessage: failed(this.state.value) });
    }
  }

  render() {
    return (
      this.props.render({
        form={this.props.form}
        value={this.props.form.values[this.props.name]}
        valid={!this.props.form.validity[this.props.name]}
        active={this.state.active}
        touched={this.state.touched}
        errorMessage={this.state.errorMessage}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
      });
    );
  }
}

const BaseInput = withForm(BaseInputView);
```

Now the form works as intended. More on this later. :)
