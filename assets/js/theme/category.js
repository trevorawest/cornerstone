import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';
import swal from './global/sweet-alert';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    getCart() {
        return fetch('/api/storefront/cart', {
            credentials: 'include'
        }).then(function (response) {
            return response.json();
        });
    }

    addAllToCart(event) {
        // get all products within this category
        const categoryId = this.context.categoryId;

        // should use bigcommerce api to fetch due to categoryProductsPerPage limit
        let productIds = [];
        $('ul.productGrid li.product .card').each((i, product) => {
            productIds.push($(product).data('productId'));
        });

        // get the cart quantity so we can properly update the cart's counter
        let cartQuantity = localStorage.getItem('cart-quantity');
        if (cartQuantity) {
            cartQuantity = parseInt(cartQuantity, 10) + productIds.length;

            // update local storage since they so nicely gave it to us
            localStorage.setItem('cart-quantity', cartQuantity);
        } else {
            cartQuantity = 0;
        }

        let requestsQueue = [];

        // add each item to the cart
        for (let i = 0; i < productIds.length; i++) {
            // this method will create the cart if it doesn't exist
            let request = $.get(`/cart.php?action=add&product_id=${productIds[i]}`);

            requestsQueue.push(request);

            // use event hooks
            hooks.emit('cart-item-add', event, event.target);
        }

        // once all ajax requests return
        $.when(requestsQueue).done(function (args) {
            // added items, so show the button
            $('[data-button-type="remove-all-cart"]').show();

            // use event hook to update cart's quantity badge
            const $body = $('body');
            $body.trigger('cart-quantity-update', cartQuantity);

            // notify user of event (could translate text here)
            const itemTranslation = productIds.length === 1 ? 'item' : 'items';
            swal.fire({
                position: 'top-end',
                text: `Added ${productIds.length} ${itemTranslation} to cart`,
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
            });
        });
    }

    removeAllFromCart() {
        this.getCart().then((carts) => {
            let cartId = '';
            if (carts.length > 0 && carts[0].hasOwnProperty('id')) {
                cartId = carts[0].id;
            }

            if (cartId.length > 0) {
                this.deleteFromCart(cartId).then(function (response) {
                    // no items, so hide the button
                    $('[data-button-type="remove-all-cart"]').hide();

                    // use event hook to reset cart's quantity badge
                    const $body = $('body');
                    $body.trigger('cart-quantity-update', 0);

                    // notify user of event (could translate text here)
                    swal.fire({
                        position: 'top-end',
                        text: 'Cart has been emptied',
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }).catch(err => {
                    swal.fire({
                        position: 'top-end',
                        text: 'Failed to empty cart',
                        icon: 'error'
                    });
                });
            } else {
                // if they see this then they used the inspect tool to show the button
                swal.fire({
                    position: 'top-end',
                    text: 'Cart already empty',
                    icon: 'error',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        })
    }

    deleteFromCart(cartId) {
        return fetch(`/api/storefront/carts/${cartId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(function (response) {
            return response;
        });
    }

    setToSecondImage(cardImgContainer) {
        let cardImg = cardImgContainer.find('.card-image');
        cardImg.attr('srcset', cardImg.data('secondimage'));
    }

    resetToFirstImage(cardImgContainer) {
        let cardImg = cardImgContainer.find('.card-image');
        cardImg.attr('srcset', cardImg.data('srcset'));
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        // show remove all button if cart has items (default is hidden)
        const cartQuantity = localStorage.getItem('cart-quantity');
        if (cartQuantity && parseInt(cartQuantity, 10) > 0) {
            $('[data-button-type="remove-all-cart"]').show();
        }

        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        $('[data-button-type="add-all-cart"]').on('click', (e) => this.addAllToCart(e));
        $('[data-button-type="remove-all-cart"]').on('click', (e) => this.removeAllFromCart());

        $('ul.productGrid li.product .card-figure').on('mouseenter', (e) => this.setToSecondImage($(e.currentTarget)));
        $('ul.productGrid li.product .card-figure').on('mouseleave', (e) => this.resetToFirstImage($(e.currentTarget)));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}
