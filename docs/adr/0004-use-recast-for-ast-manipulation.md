# 4. Use Recast for AST manipulation

Date: 2019-07-06

## Status

Accepted

## Context

We used Babel to parse code into AST, transform this AST and re-generate code.

We went for Babel because it's popular, very active and is capable of parsing a lot of different syntaxes. Notably, it parses JSX, TS and TSX out of the box. That's great!

What is not great is the code generation part. Babel formats the generated code. That means the code contained inside a transformed node gets reformated. This is not cool.

## Decision

As we want to preserve the original style of the transformed code as much as possible, we went for [Recast][recast].

As the library says:

> The magic of Recast is that it reprints only those parts of the syntax tree that you modify.

Thus, we now use Recast to parse and generate the code. AST transformation is still performed by Babel. Recast uses Babel to parse the code into AST, so we keep Babel benefits such as parsing JSX, TS and TSX out of the box.

## Consequences

This is what would happen before we switched to Recast:

![Demo that code gets reformatted][refactoring-before-recast]

With Recast, this is how the refactoring now performs:

![Demo that code keeps the original format][refactoring-after-recast]

<!-- Links -->

[recast]: https://github.com/benjamn/recast
[refactoring-before-recast]: https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/assets/0004-refactoring-before-recast.gif?raw=true
[refactoring-after-recast]: https://github.com/nicoespeon/abracadabra/blob/main/docs/adr/assets/0004-refactoring-after-recast.gif?raw=true
