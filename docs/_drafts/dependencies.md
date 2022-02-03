endnote about libraries hangups: maybe worth it's own mini post: There's libraries out there for both kinds of masks, but I don't like other libraries for small-medium sized problems. Often, the cost of learning and troubleshooting and mixing in a new library is similar to making my own solution. And I'm picky. And I learn the most when I develop a solution with only the native language. [endnote, this is usually a javascript library problem, whether it's the broken nature of the js or the js developers. small libraries that I've enjoyed are klemboard, ]

And dependencies kinda suck. I like being independent? things less likely to fail, more likely to be future proof. js changes too much, js metagame / libraries change too much.

maybe one library is m max dependency? i should check my projects and see how many external libs each project references.
  its ok if that library has several dependencies. big ones - numpy, react, etc. important people and groups and softare rely on it, so it will be maintained well.

  small ones - usually made by a small person or group and they have a handle on things, at least for a while.

  worst case, its old and its dependencies are broken or lagnuage features outdated. maybe some other new incompaitiblity. but i can find the motivation to troubleshoot one broken dependency if I really depend on it
    i cannot find the motivation to troubleshoot a broken package manager (npm, looking at you) or several broken libraries

how does versioning tie in? i think the problems persist despite versioning. often need to upgrade to newest - secutiry concerns (npm, looking at you), or a juicy new feautre i want/need


things that have helped?





____

endnote from venn post 1 about slow 2d arrs



\* It would be nice to implement every option and run tests. But I hardly find the time and motivation to even profile the one implementation I decide on. The reason behind the claim is that iterating plain 2d arrays means nested for-loops: time complexity `O(n^2)`. My understanding is that lower-level 2d array optimizations involve something like storing rows consecutively in memory, and consecutive memory is `O(better)`. These things are often hidden from high-level language use
