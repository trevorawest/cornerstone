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

### Feature 2

This feature adds an 'Add All to Cart' button and a 'Remove All Items' button.

Modified Files:

1. assets\js\theme\category.js

2. templates\components\products\card.html

3. templates\components\category\product-listing.html

4. lang\\*.json

File 1 houses all button logic (using the Storefront API) and notifications. I used `sweetalert` to notify the user of added and removed cart items. This file also ties into Event Hooks to update the cart quantity.

File 2 added a `product-id` data attribute to the card template for easy retrieval. 

File 3 has the button HTML

File 4 is all updated translation files. I used Google Translate for *most* of them.

### Bonus Feature

This feature adds a banner with customer information to the category page.

Modified Files:

1. templates\components\common\header.html

File 1 inserts the banner HTML and uses the `customer` theme object to display their name. On the 'Special Items' category, a short message is appended that utilizes the `category` theme object.