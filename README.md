# oBundle Test

## Preview URL

[Preview Site](https://obundle-test8.mybigcommerce.com/special-items/)

## Preview Code

`yvxiif1hqm`

## Overview

### Feature 1

This feature displays the secondary product image when hovering a product in the category page. 

Modified Files:

1. templates\components\common\responsive-img.html

2. assets\js\theme\category.js

File 1 was used to insert the second image's `srcset` as a data attribute.

File 2 replaces the current `srcset` with the one in the data attribute on `mouseenter` and reverts it on `mouseleave`

