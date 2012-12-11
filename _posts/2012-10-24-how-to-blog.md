---
layout: post
title: How to write a blog post
subtitle: Reminding myself how to use Jekyll to write my posts
tags: [jekyll, how to]
---

1. In your site folder ("notrobotic" for me), where you keep the project, make sure you're on the `src` branch.

2. Create a new file in the _posts directory.

3. Name it YYYY-mm-dd-my-title.md

4. Put YAML front matter at the top, use appropriate properties (for me, it's -- layout: post, title: My Title, subtitle: If I have one)

5. Write the post using Markdown

6. Save the post and commit the changes to 'src'

7. Push those changes to the src branch, if you want (not necessary, but possibly good for backup)

8. Run `$ genblog`, an alias for [the bash script](https://gist.github.com/4258869) that generates the blog, copies the \_site folder, switches to the `master` branch, pulls in all the compiled contents of the \_site folder, and pushes those changes to github to be served by Github pages with the .nojekyll command flag 

9. Done!

Of course, you _could_ just create a branch called 'github-pages' and Github will run your src files through jekyll for you. But then, you can't use any custom Jekyll plugins at all. I use Less for my CSS generation, so I need to run plugins. So I run the plugins locally on jekyll generation and then tell github not to run my files through jekyll by including the `.nojekyll` directive.