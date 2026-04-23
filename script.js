// Polyfill for NodeList.forEach for older Android WebViews
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

document.addEventListener('DOMContentLoaded', () => {
    // Dropdown Menu Mobile Toggle
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                this.parentElement.classList.toggle('active');
            }
        });
    });

    // Shopping Cart Logic
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
    } catch(e) {}

    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const cartBadge = document.getElementById('cart-badge');
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMsg = document.getElementById('empty-cart-msg');
    const btnCheckout = document.getElementById('btn-checkout');

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadge) cartBadge.innerText = totalItems;
        if (!cartItemsContainer) return;
        const emptyMsgHtml = emptyCartMsg ? emptyCartMsg.outerHTML : '<div class="empty-cart-msg" id="empty-cart-msg" data-en="Your cart is empty" data-ar="السلة فارغة حالياً">السلة فارغة حالياً</div>';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = emptyMsgHtml;
        } else {
            let html = '';
            cart.forEach((item, index) => {
                html += `
                <div class="cart-item">
                    <img src="${item.imgSrc}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn minus" data-index="${index}">-</button>
                            <input type="text" class="qty-input" value="${item.quantity}" readonly>
                            <button class="qty-btn plus" data-index="${index}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            });
            cartItemsContainer.innerHTML = html;

            document.querySelectorAll('.qty-btn.plus').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = e.target.getAttribute('data-index');
                    cart[idx].quantity++;
                    saveCart();
                    updateCartUI();
                };
            });

            document.querySelectorAll('.qty-btn.minus').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = e.target.getAttribute('data-index');
                    if (cart[idx].quantity > 1) {
                        cart[idx].quantity--;
                    } else {
                        cart.splice(idx, 1);
                    }
                    saveCart();
                    updateCartUI();
                };
            });

            document.querySelectorAll('.remove-item').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = e.currentTarget.getAttribute('data-index');
                    cart.splice(idx, 1);
                    saveCart();
                    updateCartUI();
                };
            });
        }
    }

    function saveCart() {
        try { localStorage.setItem('cart', JSON.stringify(cart)); } catch(e) {}
    }

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        updateCartUI();
    }

    if (cartToggle) cartToggle.onclick = toggleCart;
    if (closeCart) closeCart.onclick = toggleCart;
    if (cartOverlay) cartOverlay.onclick = toggleCart;

    if (btnCheckout) {
        btnCheckout.onclick = () => {
            if (cart.length === 0) {
                alert(document.documentElement.lang === 'en' ? 'Your cart is empty!' : 'السلة فارغة!');
                return;
            }
            let message = "السلام عليكم، أود طلب الآتي:\n\n";
            cart.forEach(item => { message += `- ${item.quantity}x ${item.name}\n`; });
            message += "\nشكراً لكم.";
            const whatsappUrl = `https://wa.me/201008137386?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        };
    }

    updateCartUI();

    // Navbar
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    hamburger.onclick = () => {
        navLinks.classList.toggle('active');
        const links = document.querySelectorAll('.nav-links li');
        links.forEach((link, index) => {
            if (link.style.animation) link.style.animation = '';
            else link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
        });
    };

    // Sticky Header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // Dynamic Content Loading
    async function loadDynamicProducts() {
        try {
            const res = await fetch('/api/products');
            const products = await res.json();
            
            const grouped = products.reduce((acc, p) => {
                if (!acc[p.category]) acc[p.category] = [];
                acc[p.category].push(p);
                return acc;
            }, {});

            for (const category in grouped) {
                const container = document.getElementById(`gallery-${category}`);
                const reviewsSlider = document.getElementById('reviews-slider');
                
                if (category === 'reviews' && reviewsSlider) {
                    reviewsSlider.innerHTML = grouped[category].map(p => `
                        <div class="review-item"><img src="${p.image_url}" alt="Review"></div>
                    `).join('');
                } else if (container) {
                    container.innerHTML = grouped[category].map(p => `
                        <img src="${p.image_url}" alt="${p.title || ''}">
                    `).join('');
                }
            }

            // Run original gallery logic after content is loaded
            initGalleryFeatures();
            setupReveal();
            if (document.documentElement.lang === 'en') translatePage('en');

        } catch (err) { console.error('Load Error:', err); }
    }

    function initGalleryFeatures() {
        // Original logic to wrap images and add buttons
        const showcaseGrids = document.querySelectorAll('.showcase-grid');
        showcaseGrids.forEach(grid => {
            let sectionName = 'القسم';
            if (grid.previousElementSibling && grid.previousElementSibling.tagName === 'H3') {
                sectionName = grid.previousElementSibling.innerText.trim();
            } else if (grid.parentElement.querySelector('h3')) {
                sectionName = grid.parentElement.querySelector('h3').innerText.trim();
            }

            const images = Array.from(grid.querySelectorAll('img:not(.processed)'));
            images.forEach((img, index) => {
                img.classList.add('processed');
                const wrapper = document.createElement('div');
                wrapper.className = 'product-item';

                const badge = document.createElement('span');
                badge.className = 'product-badge';
                badge.innerText = `صورة رقم ${index + 1}`;

                const orderBtn = document.createElement('a');
                orderBtn.className = 'btn-order';
                orderBtn.href = '#';
                orderBtn.innerHTML = '<i class="fa-brands fa-whatsapp" style="margin-left: 8px;"></i> أضف للسلة';

                const productName = `${sectionName} (صورة رقم ${index + 1})`;
                const productImg = img.src;

                orderBtn.onclick = (e) => {
                    e.preventDefault();
                    const existingItem = cart.find(item => item.name === productName);
                    if (existingItem) existingItem.quantity++;
                    else cart.push({ name: productName, imgSrc: productImg, quantity: 1 });
                    saveCart();
                    updateCartUI();
                    if (!cartSidebar.classList.contains('active')) toggleCart();
                    
                    const originalHtml = orderBtn.innerHTML;
                    orderBtn.innerHTML = '<i class="fa-solid fa-check" style="margin-left: 8px;"></i> تم الإضافة';
                    setTimeout(() => { orderBtn.innerHTML = originalHtml; }, 2000);
                };

                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
                wrapper.appendChild(badge);
                wrapper.appendChild(orderBtn);
                
                // Add Lightbox to new images
                img.style.cursor = 'zoom-in';
                img.onclick = () => {
                    const lb = document.getElementById('lightbox');
                    const lbImg = document.getElementById('lightbox-img');
                    lbImg.src = img.src;
                    lb.classList.add('active');
                };
            });
        });
    }

    function setupReveal() {
        const revealElements = document.querySelectorAll('.fade-in-up, .reveal-left, .reveal-right, .reveal-up');
        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('visible');
                });
            }, { threshold: 0.05, rootMargin: "50px" });
            revealElements.forEach(el => observer.observe(el));
        } else {
            revealElements.forEach(el => el.classList.add('visible'));
        }
    }

    // Lightbox Setup
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `<span class="lightbox-close">&times;</span><img class="lightbox-content" id="lightbox-img">`;
    document.body.appendChild(lightbox);
    lightbox.querySelector('.lightbox-close').onclick = () => lightbox.classList.remove('active');
    lightbox.onclick = (e) => { if (e.target.id === 'lightbox') lightbox.classList.remove('active'); };

    loadDynamicProducts();

    // Translation
    function translatePage(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
        const btn = document.getElementById('lang-toggle');
        if (btn) btn.innerText = lang === 'en' ? 'AR' : 'EN';
        
        document.querySelectorAll('.btn-order').forEach(btn => {
            const isAdded = btn.innerHTML.includes('fa-check');
            if (lang === 'en') btn.innerHTML = isAdded ? '<i class="fa-solid fa-check"></i> Added' : '<i class="fa-brands fa-whatsapp"></i> Add to Cart';
            else btn.innerHTML = isAdded ? '<i class="fa-solid fa-check"></i> تم الإضافة' : '<i class="fa-brands fa-whatsapp"></i> أضف للسلة';
        });
    }

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.onclick = () => {
            const newLang = document.documentElement.lang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('lang', newLang);
            translatePage(newLang);
        };
        if (localStorage.getItem('lang') === 'en') translatePage('en');
    }

    // Dark Mode
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.onclick = () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };
});
