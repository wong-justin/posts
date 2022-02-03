---
layout: post
title:  "All the Venns"
description: "Making a venn diagram with N sets."
date:   2022-01-31 16:38 -0400
modified_date: 2022-01-31 20:14 -0400
tags: p5js venn-diagram masking bitflags
permalink: /:title/
prev_in_series: venn-diagram-bits
nth_of_series: "3 of 3"
---

I told myself only 2-3 set venn diagrams mattered, which is true for my students, but I should've known better. My problem solving would never truly be finished until I found have the general solution.

What's left to be generalized from [last time](link to last, or maybe not if already easy to access. too many links on my pages sometimes)? In other words, what was hard coded or done manually?
- Creating the shapes for each set
- Assigning bits to each set
- Creating those darn borders

Let's look for some patterns so we can generalize each step.

## Shapes

What's the solution for determining the shapes for `N` overlapping regions? For example, if `N=2`, should it output, A, B, or something else?

image A, spaced far apart. image B, closer. maybe 4 venn or 5 venn if needed

If you can answer that with an algorithm, you win. But for me, the question becomes "what shape positions actually look good?" [1] I've picked out some for small `N`:

[show them]

but it's subjective and messy:
- the only common thread I can find is symmetry, which `N=4` barely has
- how can you justify these exact proportions and rotations? (for `5` I fiddled around with the decimals of a vector called `magicInnerOffset`)
- how can you justify curvy shapes over polygons, or flowery star shapes? (link to triangle venn or sometehing https://raw.githubusercontent.com/wiki/tctianchi/pyvenn/venn6.png)
- for `N > 5` everything gets less trivial and usually ugly, no more ellipses (https://www.combinatorics.org/files/Surveys/ds5/pngs/6-nVD-colour.png) (https://i.pinimg.com/736x/29/90/e4/2990e448846be0e2e77cbb81de38761a--venn-diagrams-pin-it.jpg)
- hard to justify one set of angles and sizes over another
- I might be biased after searching all sorts venn images and seeing the popular ones more often, and
- you might like different ones (xkcd has one https://xkcd.com/2122/)

[1]  Maybe one day I'll investigate some general process to make sensibly sized shapes, maybe using something about area-proportional unit regions. Even if they won't look perfect, at least it would be fully generalized. Then look out part 4 to the venn diagram story.

We can let shapes be the only manually created part of the venn diagram. The other components have concrete solutions, thankfully.

___


## Bits


yes

aka how did Pascal's triangle get in my bits

___



## Borders

yes

___


## Result
play with it here!

[insert sandbox]
  maybe letting them pass in their own shapes, or maybe just giving a few different demos to play with, or just yeah.

___
Lessons? eh

I tried to sprinkle little gems thoughts themes best practices throughout the series

___
Revisions?

I kinda wanna try polygon clipping (vectors), not raster-based image masks. Hopefully would improve performance and def would make better online viewing (scalable, etc)

SVG seems like the most promising. red blob games makes his things largley svg

lots of possiblities

even a clip path, probably useful

___

Performance? eh

tied to my p5js implementation, which is not so special compared to the state representation concept that was supposed to be the start (part 2), and image masks really hurt performance. memoization of masking operations is only feature I can think of that would really help. otherwise I would just redo with geometric polygon clipping masks.

___

Fun properties? eh

some research into higher venn diagrams
(https://webhome.cs.uvic.ca/~ruskey/Publications/Venn11/Venn11.html)

big graphic with lots of good details and definitions useful when digging deeper
(https://webhome.cs.uvic.ca/~ruskey/Publications/Venn11/VD_11_PosterG.pdf)

this guy's post briefly goes into more venns:
(https://uncoverafew.wordpress.com/2011/11/14/dividing-the-plane-part-2/)

more research:
(http://webhome.cs.uvic.ca/~ruskey/Publications/SixVenn/SixVenn.html)
  (i should send him a link to my coding! I was just trying to tell a story of a nice implementation, your graphics are cool, things get really hairy for N>5 so glad there's people like you working on that)

  has a picture of 7-venn made from 4-gons
  (http://webhome.cs.uvic.ca/~ruskey/Publications/VennConvex/VennKgons.html)

  3 dimensional venns?
  [](http://webhome.cs.uvic.ca/~ruskey/Publications/VennSphere/VennSphereTwo.html)
