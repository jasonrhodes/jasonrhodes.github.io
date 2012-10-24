---
layout: post
title: How to write a blog post
subtitle: Reminding myself how to use Jekyll to write my posts
tags: [jekyll, how to]
---

1. In your notrobotic folder, where you keep this project, make sure you're on the `src` branch.

2. Create a new file in the _posts directory.

3. Name it YYYY-mm-dd-my-title.md

4. Put YAML front matter at the top, use layout: post, title: My Title, subtitle: If you have one

5. Write the post using Markdown

6. Save the post and commit the changes.

7. Push those changes to the src branch? Maybe?

8. Run `$ genblog`, an alias for the bash script you wrote that generates the blog, copies the _site folder, switches to the `master` branch, pulls in all the compiled contents of the _site folder, and pushes those changes to github to be served by Github pages with the .nojekyll command flag

9. Done!
