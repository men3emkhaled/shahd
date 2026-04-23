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
            const msg = document.getElementById('empty-cart-msg');
            if (msg) msg.style.display = 'block';
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
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    cart[idx].quantity++;
                    saveCart();
                    updateCartUI();
                });
            });

            document.querySelectorAll('.qty-btn.minus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    if (cart[idx].quantity > 1) {
                        cart[idx].quantity--;
                    } else {
                        cart.splice(idx, 1);
                    }
                    saveCart();
                    updateCartUI();
                });
            });

            document.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.currentTarget.getAttribute('data-index');
                    cart.splice(idx, 1);
                    saveCart();
                    updateCartUI();
                });
            });
        }
    }

    function saveCart() {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch(e) {}
    }

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        updateCartUI();
    }

    if (cartToggle) cartToggle.addEventListener('click', toggleCart);
    if (closeCart) closeCart.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (cart.length === 0) {
                alert(document.documentElement.lang === 'en' ? 'Your cart is empty!' : 'السلة فارغة!');
                return;
            }
            let message = "السلام عليكم، أود طلب الآتي:\n\n";
            cart.forEach(item => { message += `- ${item.quantity}x ${item.name}\n`; });
            message += "\nشكراً لكم.";
            const whatsappUrl = `https://wa.me/201008137386?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    updateCartUI();

    // Navbar Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const links = document.querySelectorAll('.nav-links li');
        links.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
    });

    // Sticky Header
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) { header.classList.add('scrolled'); } 
        else { header.classList.remove('scrolled'); }
    });

    // Scroll Reveal Animation
    function setupReveal() {
        const revealElements = document.querySelectorAll('.fade-in-up, .reveal-left, .reveal-right, .reveal-up');
        if (typeof IntersectionObserver !== 'undefined') {
            const observerOptions = { threshold: 0.05, rootMargin: "50px" };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) { entry.target.classList.add('visible'); }
                });
            }, observerOptions);
            revealElements.forEach(el => observer.observe(el));
        } else {
            revealElements.forEach(el => el.classList.add('visible'));
        }
    }

    // Dynamic Product Loading
    async function loadDynamicProducts() {
        try {
            const res = await fetch('/api/products');
            const products = await res.json();
            
            // Group products by category
            const grouped = products.reduce((acc, p) => {
                if (!acc[p.category]) acc[p.category] = [];
                acc[p.category].push(p);
                return acc;
            }, {});

            // Populate containers
            for (const category in grouped) {
                const container = document.getElementById(`gallery-${category}`);
                const slider = category === 'reviews' ? document.getElementById('reviews-slider') : null;
                
                if (container || slider) {
                    const target = slider || container;
                    target.innerHTML = grouped[category].map((p, index) => {
                        if (category === 'reviews') {
                            return `<div class="review-item"><img src="${p.image_url}" alt="Review"></div>`;
                        }
                        
                        const productName = p.title || `منتج رقم ${index + 1}`;
                        return `
                            <div class="product-item">
                                <img src="${p.image_url}" alt="${productName}" class="dynamic-img">
                                <span class="product-badge">${productName}</span>
                                <a href="#" class="btn-order" data-name="${productName}" data-img="${p.image_url}">
                                    <i class="fa-brands fa-whatsapp" style="margin-left: 8px;"></i> أضف للسلة
                                </a>
                            </div>
                        `;
                    }).join('');
                }
            }

            // Re-attach listeners for dynamic content
            attachOrderListeners();
            setupLightbox();
            setupReveal();
            if (document.documentElement.lang === 'en') translatePage('en');

        } catch (err) {
            console.error('Error loading products:', err);
        }
    }

    function attachOrderListeners() {
        document.querySelectorAll('.btn-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productName = btn.getAttribute('data-name');
                const productImg = btn.getAttribute('data-img');
                
                const existingItem = cart.find(item => item.name === productName);
                if (existingItem) { existingItem.quantity++; } 
                else { cart.push({ name: productName, imgSrc: productImg, quantity: 1 }); }
                
                saveCart();
                updateCartUI();
                if (!cartSidebar.classList.contains('active')) toggleCart();
                
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check" style="margin-left: 8px;"></i> تم الإضافة';
                setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
            });
        });
    }

    function setupLightbox() {
        let lightbox = document.getElementById('lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `<span class="lightbox-close">&times;</span><img class="lightbox-content" id="lightbox-img">`;
            document.body.appendChild(lightbox);
        }

        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxClose = lightbox.querySelector('.lightbox-close');

        document.querySelectorAll('.showcase-grid img, .dynamic-img, .about-image img').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
            });
        });

        lightboxClose.onclick = () => lightbox.classList.remove('active');
        lightbox.onclick = (e) => { if (e.target !== lightboxImg) lightbox.classList.remove('active'); };
    }

    loadDynamicProducts();

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.classList.contains('dropdown-toggle') && window.innerWidth <= 768) return;
            e.preventDefault();
            navLinks.classList.remove('active');
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Dark Mode
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    let savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    themeToggle.addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Translation System
    const translations = {
        "الرئيسية": "Home", "من أنا": "About Me", "منتجاتنا": "Products", "المعرض": "Gallery", "تواصل معنا": "Contact Us",
        "شهد عبدالمنعم": "Shahd Abdelmonem", "صنع يدوي": "Handmade", "حب وشغف": "Love & Passion", "اطلبي الآن": "Order Now",
        "أضف للسلة": "Add to Cart", "تم الإضافة": "Added"
    };

    function translatePage(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
        const btn = document.getElementById('lang-toggle');
        if (btn) btn.innerText = lang === 'en' ? 'AR' : 'EN';

        document.querySelectorAll('.btn-order').forEach(btn => {
            const isAdded = btn.innerHTML.includes('fa-check');
            if (lang === 'en') {
                btn.innerHTML = isAdded ? '<i class="fa-solid fa-check" style="margin-right: 8px;"></i> Added' : '<i class="fa-brands fa-whatsapp" style="margin-right: 8px;"></i> Add to Cart';
            } else {
                btn.innerHTML = isAdded ? '<i class="fa-solid fa-check" style="margin-left: 8px;"></i> تم الإضافة' : '<i class="fa-brands fa-whatsapp" style="margin-left: 8px;"></i> أضف للسلة';
            }
        });
    }

    const langToggleBtn = document.getElementById('lang-toggle');
    if (langToggleBtn) {
        let savedLang = localStorage.getItem('lang') || 'ar';
        if (savedLang === 'en') translatePage('en');
        langToggleBtn.addEventListener('click', () => {
            const newLang = document.documentElement.lang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('lang', newLang);
            translatePage(newLang);
        });
    }
});
