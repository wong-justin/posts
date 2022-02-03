---
layout: post
title:  "Representing Venn Diagram State"
description: "See how nicely bitwise operations match set logic."
date:   2022-01-20 13:49:11 -0400
tags: p5js venn-diagram masking bitflags
permalink: /:title/
prev_in_series: venn-diagram-masks
next_in_series: venn-diagrams-generalized
nth_of_series: "2 of 3"
---

This is the juicy part. Say we want to keep track of clicked regions. If we make new variables for each, that would be a total of 14 variables so far in a 2-set venn diagram...

```
circleA
circleB
borderA
borderB
maskA
maskB
maskA_only
maskB_only
maskAB
mask_outside

A_only_active
B_only_active
AB_active
outside_active
```
...and they're sharing meaning and naming patterns. There should be a better way to store and access everything, one that shows the boolean logic. Something like:

```2
circles = [A, B]
borders = [A, B]
masks = [
  A,
  B,
  A && !B,
  B && !A,
  A && B,
  !(A || B)
]
active_regions = [
  A && !B,
  B && !A,
  A && B,
  !(A || B)
]
```
This way everything can be named and accessed in terms of `A` and `B`, just like a venn diagram ought to be. And it would extend nicely to a 3 set venn diagram. How could this be implemented?

### a) Beauty of bits, story time

Bits are great for `AND`/`OR` operations. They can also make for a sensible developer experience. I was happy to first see this with **bit flags** during a [project](https://github.com/wong-justin/fast-bible) of mine.

Here's the GUI framework [docs](https://doc.qt.io/qt-5/qt.html#AlignmentFlag-enum) and an example of positioning a widget at the bottom-right:

```python
parent.add(child, alignment = Qt.AlignBottom | Qt.AlignRight )
```

The widget should be at the bottom _"and"_ the right, but it reads like bottom _"or"_ the right, and it's a bitwise-OR at that. (I didn't understand why `||` wasn't working at first...) Huh?

Turns out each alignment flag is just a number with only 1 bit turned on. Each flag has its own reserved bit.
```
00000001  left
00000010  right
00000100  h-center
00001000  justify
00010000  top
00100000  bottom
01000000  v-center
10000000  baseline
```
 A combination (`OR`) tells what flags are on or off according to what bits are on or off. So flags can be `OR`ed together into a new number, passed around, and parsed back into their separate flag numbers. Magic! So much functionality in just a series of bits.
```
    developer gives: v-center | h-center   // i wish centering a div was this logical

which really equals:
                     01000000
                  OR 00000100
                     ________
gui engine recieves: 01000100

         and parses: 01000000,
                     00000100
```
And this works for any number of flags, in any order, with any logical expression.

Let's adapt this to venn diagram labels.

### b) Venn diagram bits

Each bit must be the smallest unit of information. What are the indivisible units of a venn diagram? They'll be referred to as `units` or `unit regions` from now on (as opposed to `subregions` that could be composed of multiple units, or even more vaguely, `regions` 🤢). A 2-set venn diagram has 4 unit regions. So the first step is assigning 4 bits.

![bit labels](/assets/venn/2venn_unit_region_bit_labels.png)

It doesn't matter which unit region gets what bit. All the combinations will still be unique, and after this point, the bits shouldn't matter to the developer.

We just have to assign the main composite bit flags `A` and `B` their values. It's a quick manual `OR`:

```js
let A = 0b0011,   // 0001 | 0010
    B = 0b0110    // 0100 | 0010
```

For fun, you can make some combinations and see the result bits:

> ```js
> printBits(..., 4)
>
> A & B               // 0010
> A | B               // 0111
> ~(A | B)            // 1000 *
> (A & ~B) | (B & ~A) // 0101
> (A | B) & ~(A & B)  // 0101
> ```

Everything from here on is declarative boolean expressions (using bitwise operators):

```js
let circles = {
  [A]: newCircle(center.x - radius/2, center.y, radius),
  [B]: newCircle(center.x + radius/2, center.y, radius)
}

let masks = {
  [A]: newBooleanMask(sequence(_fill, circles[A].draw)),
  [B]: newBooleanMask(sequence(_fill, circles[B].draw)),
}
masks = {
  [ A & ~B] : masks[A].and(masks[B].not()),
  [ B & ~A] : masks[B].and(masks[A].not()),
  [ A & B ] : masks[A].and(masks[B]),
  [~(A | B)]: masks[A].or(masks[B]).not(),
  ...masks
}

let borders = {
  [A]: OffscreenRenderer.render(sequence(_stroke, _nofill, circles[A].draw)),
  [B]: OffscreenRenderer.render(sequence(_stroke, _nofill, circles[B].draw))
}

let activeUnits = {
  [ A & ~B] : false,
  [ B & ~A] : false,
  [ A & B ] : false,
  [~(A | B)]: false,
}
```

Satisfying!

<details>

<summary>A little DRYer, if you think it's worth it:</summary>

```js
let circles = generateKeyVals([A, B], (key, i) => {
  let dx = (i == 0 ? -radius/2 : radius/2)
  return newCircle(center.x + dx, center.y, radius)
})

let masks = generateKeyVals([A,B],
  (key) => newBooleanMask(sequence(_fill, circles[key].draw)) )

masks = {
  ...masks,
  [A & ~B]  : masks[A].and(masks[B].not()),
  [B & ~A]  : masks[B].and(masks[A].not()),
  [A & B]   : masks[A].and(masks[B]),
  [~(A | B)]: masks[A].or(masks[B]).not(),
}

let borders = generateKeyVals([A,B],
  (key) => OffscreenRenderer.render(sequence(_stroke, _nofill, circles[key].draw)) )

let units = [
  A & ~B,
  B & ~A,
  A & B,
  ~(A | B)
]

let activeUnits = generateKeyVals(units, () => false)
```

</details>

...

Simple, clear, extensible 👍. Now the venn diagram is ready to add features.


## Interactivity

The venn diagram should have selectable unit regions. Let's detect some mouse clicks and use the `activeUnits` list created earlier.

When the mouse clicks, how do we get the unit region under a mouse position? It would be difficult to perform the math for `isPointInside` in the complex, curvy, and often concave unit region geometries.

![which unit region is this point in](/assets/venn/2venn_is_mouse_over_me.png)

Once again,  boolean logic is the answer! Instead of `isPointInsideCurvyRegion` (hard), we can `AND` the result of `isPointInsideCircle` for `A` and `B` (easy).

That would be equivalent to the same boolean expressions throughout the venn diagram: `inA && !inB`, `!inA && !inB`, etc. Hoewever, we don't have a good way to programatically mirror boolean `inCircleA && ...` with bitwise `A & ...`.

How about a different, more algorithmic way of thinking about it? We can narrow down the region of a point based on the sets it's located in, like a binary game of "20 questions":

```
possible bits: 1111
in B?         (0110)
No
possible bits: 1001
in A?         (0011)
Yes
possible bits: 0001
```

![the point must be in this unit region](/assets/venn/2venn_must_be_here_narrowing.png)

As pseudocode:

```
for each set and its circle:
  if point in the circle
    AND the set bits
  else
    AND NOT the set bits
```

Into existing code:

```js
function mousePressed() {

  let region = 0b1111   // start broad, could be any bit

  venn.setFlags.forEach(set => {

    let isInsideSet = isPointInsideCircle({x: mouseX, y: mouseY},
                                          venn.circles[set])

    let narrowerRegion = region & (isInsideSet ?
      set   // keep the bits in this set
      :
      ~set  // exclude the bits in this set
    )
    region = narrowerRegion
  })

  // region is now narrowed down to one bit, a unit region
  venn.activeUnits[region] = ! venn.activeUnits[region]

  render()
}

```

Changes needed to implement this:

- a list of `sets` to iterate through `A`, `B`.

  ```
  newVenn {
    let sets = [A, B]
  }
  ```

<!--
- a map of `activeSets` to indicate if the mouse is inside or not. EDIT - only necessary for mouseover, not clicks

```
newVenn = () = {
  ...
  let activeSets = generateKeyVals(sets, () => false)
}
```
-->

- need to be able to access venn state outside of self, like in mouse listeners. so expose more data.

  ```
  newVenn {
    ...
    return {draw, set, units, circles, activeUnits}
  }
  ```

- the math function.

  ```
  isPointInsideCircle = (pt, circle) => {
    return dist(pt, circle.center) < circle.radius
  }

  // aka: If you're too far from the center, you won't be inside.
  ```

- good opportunity for refactoring drawing. Separating functions will tidy things up and self-document:

  ```
  let drawActiveUnits = () => ...
  let drawBorders = () => ...

  let draw = () => {
    drawActiveUnits()
    drawBorders()
  }
  ```

And trying it out:

![gif demo, me clicking](/assets/venn/2venn_bugged_click.gif)

uh-oh

The inner unit regions work, but clicking the outside doesn't do anything.

## Bug-hunting

Let's try again and print the active units after every click:

```python
>>> {1: true,  2: false, 4: false, -8: false}
>>> {1: false, 2: false, 4: false, -8: false}
>>> {1: false, 2: true,  4: false, -8: false}
>>> {1: false, 2: false, 4: false, -8: false}
>>> {1: false, 2: false, 4: false, -8: false, 8: true}
>>> {1: false, 2: false, 4: false, -8: false, 8: false}
```

Hm, this leads to a couple questions:

#### Why does it show `1`, `2`, `4`, and `-8`?

That's the integer version of our unit region bit flags. `0b0001` = 1, `0b0010` = 2, etc. Just powers of two. But `~(A | B)`, aka `0b1000`, should be `8`, not negative 8...

The astute reader might've predicted a problem earlier when `~(A | B)` was first introduced. Here's the heart of the unexpected behavior:

```js
printBits( ~(A | B), 4)
>>> 1000
// good

~(A | B) == 0b1000
>>> false
// not good
```
<!-- ~A       == 0b1100  // also false... -->

We've only been looking at the first _4 bits_, which behave expectedly. However, `A` and `B` and their combinations are normal javascript numbers, _32 bits_. Let's look a bit closer, or rather, at all the bits.

```js
unitFlags.forEach(u => printBits(u, 32))

>>> 00000000000000000000000000000001
>>> 00000000000000000000000000000100
>>> 00000000000000000000000000000010
>>> 11111111111111111111111111111000
```

The last flag `~(A | B)` is all weird, explaining the `-8` [endnote about bit standard pattern layouts and signed ints]. How did `~(A | B)` get so many ones?

```js
// ( A | B) is normal ...
printBits( (A | B), 32)
>>> 00000000000000000000000000000111

// ...but those 28 extra bits get flipped
//    after a `NOT`...

printBits( ~(A | B), 32)
>>> 11111111111111111111111111111000

// ...and that is the reason equality fails
//    if you're expecting leading zeros,
//    like with the literal `0b1000`
printBits(0b1000, 32)
>>> 00000000000000000000000000001000

```



Well pooey. Those extra bits caused the problem.

**Is there a fix?**

It would be nice to have a 4-bit sized number type to use for `A`, `B`, and their combinations. That would prevent problems with unused bits. Javascript has no number types or sizes, but we could try to mimic a type object:

> <details>
>
> <summary>possible pseudo 4bit type</summary>
>
> ```js
> new4BitInt = (int) => {
>   // clip all but 4 bits every time you make a bit flag combination
>   int = int & 0b1111
>
>   return {
>     int: int,
>     and: (other) => new4BitInt(int & other.int),
>     or: (other)  => new4BitInt(int | other.int),
>     not: () => new4BitInt(~int),
>   }
> }
>
> A = new4BitInt(0b0011)
> B = new4BitInt(0b0011)
> A.and(B)
>
> masks = {
>   ...
>   [A.or(B).not().int]: ...
> }
>
> masks[A.or(B).not().int] == masks[0b1000]
> ```
>
> Cons:
> - lose boolean operator symbols
> - have to access `int` property to treat as an actual number
>   - but maybe A and B aren't often supposed to be treated as numbers, just abstract labels
>
> Pros:
> - mirrors mask interface... foreshadowing?
>
> </details>

We could discard unused bits another way - checking only the first 4 bits every time a region is indexed:

> <details>
>
> <summary>possible 4bit map structure</summary>
>
> ```js
> new4BitKeyMap = () => {
>   let obj = {}
>
>   return {
>     set: (k, v) => obj[k & 0b1111] = v,
>     get: (k) => obj[k & 0b1111],
>   }
> }
>
> masks = new4BitKeyMap()
>   .set( ~(A | B), ... )
>
> masks.get( ~(A | B) ) == masks.get(0b1000)
> ```
>
> There's even a way to override square bracket accessor symbols `[]` and get the normal syntax back: `masks[ ~(A | B) ]`  
>
> </details>

Or we could .. do nothing. Remember, this problem only arises when comparing certain combinations (eg `~A`) to expected binary literals (eg `0b1100`). But the bit flag design did not intend using binary literals anytime after defining `A` and `B`; only using combinations of those primary flags. So if we stick to consistent design, we won't introduce any inequality, and we can ignore this bit behavior. (Those solutions looked bothersome anyways.)

#### Why does a new key `8` appear when clicking the outside unit region?

Because we used a binary literal in `mousePressed`.

We can print the bits throughout the unit region detection algorithm and see exactly what happens:

```js



```

bug

___

What about mouseovers?

...

Pretty great! But one thing looks off...

### How do we draw unit region borders?

I want the borders of unit regions to highlight on mouseover instead of their interiors. It would tie the whole user experience together. Any other features would be trivial to add or extraneous imo. So we need to isolate these arc sections and draw them independently.

Is the solution elegant, just as in every other challenge we came across?

...

Maybe not.

You could calculate all the arcs (I did before) [endnote 1]. Not elegant, no boolean logic.









___



Notable changes:

mask drawing is no longer just for interiors, so no logners fills by default.

border demos
sequence
// sequence = fns(...)

a = new(sequence(_fill, drawSquare))
b = new

____

## 3 venn diagram?

Yes 😁

Try assigning the bits yourself -  it's fun. Everything should follow smoothly afterwards, thanks to the care of our earlier implementation.

<details>
<summary>possible bit assignment:</summary>

picture

initial binary literals

</details>

code snippets

#### 4 venn diagram?

Not really 😕

The bitflag labeling design is enough to keep me happy, and 4+ sets look ugly and aren't encountered by typical students. But it should be possible.

Circles can no longer represent sets in a 4 set venn diagram - they must be elongated, usually rendered as ellipses. So using `isPointInEllipse` should cover the mouse logic. And there's 16 unit subregions, which is not


Mouse interaction worked so easily because point


___
#### Endnotes

[3] numpy has something like [code sample here] other libraries and frameworks probably have similar structures.

[2] I never do enough testing to prove any hunches. If my code performs well enough, I just keep doing my thing. But I learned before with numpy image processing, doing things my own intuitive way like for-looping thru pixels, that there's usually a specialized and faster way to do such.

  and in numpy, boolean arrs share the same structure and methods as image arrs. how convenient

[4] It always comes back to math... To meet every need of dynamic polygon clipping, check this most helpful [thread](https://discourse.processing.org/t/boolean-operation-in-polygons/23439/11) for javascript options. Highlights:

- http://haptic-data.com/toxiclibsjs/examples/polygon-clipping-p5

- seems most in-depth, and includes an animation of the algorithm!
https://unpkg.com/polybooljs@1.2.0/dist/demo.html

- p5js sketch using the library g.js
https://editor.p5js.org/erraticgenerator/sketches/NqT3Vatdm

[and as it turns out, venn diagram regions are curvy and curvy paths are harder for polygon clipping.]

  [4.1] Polygon clipping goes deeper! Google "`polygon clipping circles`". Leaving js, going into the algorithms of it all:

  - wikipedia article of an algorithm used in the above libraries
  https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm

  - slideshow pdf, including how to clip circles
  https://www.evl.uic.edu/luc/488/slides/class4.pdf

  - similar
  https://www.cs.drexel.edu/~david/Classes/CS536/Lectures/L-08_Polygons.pdf

  In the end, they still end up splitting pixels on curves. Maybe my image masks aren't so bad.






