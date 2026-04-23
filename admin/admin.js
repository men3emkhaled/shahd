document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const productForm = document.getElementById('product-form');
    const productsList = document.getElementById('products-list');
    const logoutBtn = document.getElementById('logout-btn');

    // Check if already logged in
    checkAuth();

    async function checkAuth() {
        try {
            const res = await fetch('/api/check-auth');
            const data = await res.json();
            if (data.authenticated) {
                showDashboard();
            } else {
                showLogin();
            }
        } catch (err) {
            showLogin();
        }
    }

    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadProducts();
    }

    function showLogin() {
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
    }

    // Login logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loader = document.getElementById('login-loader');
        const errorMsg = document.getElementById('login-error');

        loader.style.display = 'inline-block';
        errorMsg.style.display = 'none';

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (data.success) {
                showDashboard();
            } else {
                errorMsg.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                errorMsg.style.display = 'block';
            }
        } catch (err) {
            errorMsg.textContent = 'حدث خطأ في الاتصال بالسيرفر';
            errorMsg.style.display = 'block';
        } finally {
            loader.style.display = 'none';
        }
    });

    // Logout logic
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        showLogin();
    });

    // Load Products
    async function loadProducts() {
        try {
            const res = await fetch('/api/products');
            const products = await res.json();
            
            if (products.length === 0) {
                productsList.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 20px;">لا توجد منتجات مضافة بعد.</p>';
                return;
            }

            productsList.innerHTML = products.map(p => `
                <div class="product-item">
                    <img src="${p.image_url}" class="product-img" alt="${p.title || 'Product'}">
                    <div class="product-info">
                        <h4>${p.title || 'بدون عنوان'}</h4>
                        <span>${getCategoryName(p.category)}</span>
                        ${p.price ? `<p style="font-size: 0.9rem; margin-top: 5px;">${p.price}</p>` : ''}
                    </div>
                    <button class="btn-delete" onclick="deleteProduct(${p.id})" title="حذف">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `).join('');
        } catch (err) {
            productsList.innerHTML = '<p style="color: var(--danger);">خطأ في تحميل المنتجات.</p>';
        }
    }

    // Upload logic
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productData = {
            title: document.getElementById('p-title').value,
            category: document.getElementById('p-category').value,
            imageUrl: document.getElementById('p-image-url').value,
            price: document.getElementById('p-price').value
        };

        const loader = document.getElementById('upload-loader');
        const uploadBtn = document.getElementById('upload-btn');

        loader.style.display = 'inline-block';
        uploadBtn.disabled = true;

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (res.ok) {
                alert('تم إضافة المنتج بنجاح');
                productForm.reset();
                loadProducts();
            } else {
                const data = await res.json();
                alert('خطأ: ' + (data.error || 'فشل الرفع'));
            }
        } catch (err) {
            alert('حدث خطأ أثناء الرفع');
        } finally {
            loader.style.display = 'none';
            uploadBtn.disabled = false;
        }
    });

    // Helper: Map category keys to Arabic names
    function getCategoryName(key) {
        const categories = {
            'bouquet': 'بوكيهات زفاف',
            'flowers': 'تجفيف ورد',
            'frames': 'براويز',
            'engagement_trays': 'صواني شبكه',
            'tablouh': 'تابلوه',
            'candles': 'شموع',
            'mugs': 'مجات',
            'wallets': 'محافظ',
            'solobetat': 'سلوبيتات اطفالي',
            'marwaha': 'مروحه العروسه',
            'mrayah': 'مرايه العروسه',
            'bried': 'أطواق برايد',
            'last': 'بوكيهات صور',
            'manadeel': 'مناديل كتب الكتاب',
            'konkreet': 'كونكريت',
            'phone_cover': 'كفر موبايل',
            'reviews': 'أراء العملاء'
        };
        return categories[key] || key;
    }

    // Delete Product (Exposed to global for onclick)
    window.deleteProduct = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadProducts();
            } else {
                alert('فشل الحذف');
            }
        } catch (err) {
            alert('خطأ في الاتصال');
        }
    };
});
