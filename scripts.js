
// ===== CONFIGURAÇÕES =====
const CONFIG = {
    firebase: {
        apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
        authDomain: "corretorcerto-76933.firebaseapp.com",
        projectId: "corretorcerto-76933",
        storageBucket: "corretorcerto-76933.firebasestorage.app",
        messagingSenderId: "357149829474",
        appId: "1:357149829474:web:324b2005d82eabbce5e43b"
    },
    defaultStoreConfig: {
        name: "Atacadão dos Revendedores",
        description: "Melhores preços em joias e acessórios",
        whatsapp: "5519999999999",
        deliveryFee: 2.00
    }
};


// ===== ESTADO GLOBAL =====
const STATE = {
    cart: [],
    products: [],
    categories: [],
    storeConfig: CONFIG.defaultStoreConfig,
    currentCategory: null,
    currentSubcategory: null,
    isCartOpen: false,
    isOnline: true,
    detailQuantity: 1
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ===== CARREGAMENTO DE DADOS INICIAIS =====
async function loadInitialData() {
    try {
        console.log('📦 Carregando dados iniciais...');
        await Promise.all([
            loadStoreConfig(),  // ✅ Agora está definida
            loadCategories(),
            loadProducts()
        ]);
        console.log('✅ Todos os dados iniciais carregados');
    } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        throw error;
    }
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
async function initializeApp() {
    try {
        showLoading();
        console.log('🚀 Inicializando aplicação...');
        
        await initializeFirebase();
        setupOfflineListener();
        await loadInitialData();  // ✅ Agora vai funcionar
        await loadExclusiveProducts();
        await loadFeaturedProducts();
        setupEventListeners();
        updateCartUI();
        setupConfigListener();
        hideLoading();
        showMessage('Loja carregada com sucesso!', 'success');
        console.log('🎉 Aplicação inicializada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showMessage('Carregando em modo offline...', 'warning');
        loadCachedData();
    }
}


// ===== FIREBASE =====
async function initializeFirebase() {
    return new Promise((resolve, reject) => {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(CONFIG.firebase);
            }
            window.db = firebase.firestore();
            
            console.log('🔥 Firebase conectado com sucesso!');
            resolve();
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error);
            reject(error);
        }
    });
}

STATE.detailQuantity = 1;
// ===== GERENCIAMENTO DE CONEXÃO =====
function setupOfflineListener() {
    window.addEventListener('online', () => {
        STATE.isOnline = true;
        showMessage('✅ Conexão restaurada!', 'success');
        syncData();
    });

    window.addEventListener('offline', () => {
        STATE.isOnline = false;
        showMessage('⚠️ Modo offline ativado', 'warning');
    });
}

async function syncData() {
    if (!STATE.isOnline) return;
    
    try {
        await loadStoreConfig();
        await loadCategories();
        await loadProducts();
        showMessage('Dados sincronizados!', 'success');
    } catch (error) {
        console.error('Erro na sincronização:', error);
    }
}

// ===== CARREGAMENTO DE DADOS =====
async function loadInitialData() {
    try {
        await Promise.all([
            loadStoreConfig(),
            loadCategories(),
            loadProducts()
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        throw error;
    }
}
// ===== CARREGAR CONFIGURAÇÕES DA LOJA =====
async function loadStoreConfig() {
    try {
        console.log('⚙️ Carregando configurações da loja...');
        
        const doc = await db.collection('config').doc('store').get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('✅ Configurações encontradas:', data);
            
            // Mesclar com configurações padrão
            STATE.storeConfig = { 
                ...CONFIG.defaultStoreConfig, 
                ...data 
            };
            
            console.log('🎯 Configurações carregadas:', {
                name: STATE.storeConfig.name,
                whatsapp: STATE.storeConfig.whatsapp,
                logoUrl: STATE.storeConfig.logoUrl
            });
            
        } else {
            console.log('📝 Nenhuma configuração encontrada, usando padrões');
            STATE.storeConfig = CONFIG.defaultStoreConfig;
        }
        
        // Atualizar a UI da loja
        updateStoreUI();
        
    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        STATE.storeConfig = CONFIG.defaultStoreConfig;
        updateStoreUI();
    }
}

async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').orderBy('name').get();
        STATE.categories = [];
        
        if (snapshot.empty) {
            console.log('📂 Criando categorias padrão...');
            await createDefaultCategories();
            await loadCategories();
        } else {
            snapshot.forEach(doc => {
                STATE.categories.push({ id: doc.id, ...doc.data() });
            });
            cacheData('categories', STATE.categories);
            displayCategories();
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        throw error;
    }
}

async function createDefaultCategories() {
    const defaultCategories = [
        { 
            name: "Joias", 
            subcategories: ["Colares", "Pulseiras", "Anéis", "Brincos"],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        { 
            name: "Roupas", 
            subcategories: ["Camisetas", "Bermudas", "Vestidos"],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        { 
            name: "Acessórios", 
            subcategories: ["Bolsas", "Cintos", "Óculos"],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }
    ];

    try {
        for (const category of defaultCategories) {
            await db.collection('categories').add(category);
        }
        console.log('✅ Categorias padrão criadas');
    } catch (error) {
        console.error('Erro ao criar categorias:', error);
        throw error;
    }
}

async function loadProducts(categoryId = null) {
    try {
        let query = db.collection('products').orderBy('createdAt', 'desc');
        
        if (categoryId) {
            query = query.where('categoryId', '==', categoryId);
        }
        
        const snapshot = await query.limit(10).get();
        STATE.products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        cacheData('products', STATE.products);
        displayProducts();
        console.log(`📦 ${STATE.products.length} produtos carregados`);
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        throw error;
    }
}

// ===== SISTEMA DE CATEGORIAS E SUBCATEGORIAS =====
function displayCategories() {
    const container = document.querySelector('.category-buttons');
    if (!container || STATE.categories.length === 0) {
        if (container) container.innerHTML = '<p>Nenhuma categoria disponível</p>';
        return;
    }

    container.innerHTML = STATE.categories.map((category, index) => `
        <button class="category-btn ${index === 0 && !STATE.currentCategory ? 'active' : ''}" 
                onclick="loadProductsByCategory('${category.id}')">
            <i class="fas fa-folder"></i> ${category.name}
        </button>
    `).join('');

    // Carrega primeira categoria se não houver categoria atual
    if (STATE.categories.length > 0 && !STATE.currentCategory) {
        loadProductsByCategory(STATE.categories[0].id);
    }
}

async function loadProductsByCategory(categoryId) {
    try {
        showLoading();
        STATE.currentCategory = categoryId;
        STATE.currentSubcategory = null;
        
        await loadProducts(categoryId);
        
        // Mostrar subcategorias se existirem
        displaySubcategories(categoryId);
        
        // Atualizar botão ativo da categoria
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Encontrar e ativar o botão da categoria clicada
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(categoryId)) {
                btn.classList.add('active');
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar produtos da categoria:', error);
        showMessage('Erro ao carregar produtos.', 'error');
    } finally {
        hideLoading();
    }
}

function displaySubcategories(categoryId) {
    const category = STATE.categories.find(cat => cat.id === categoryId);
    const subcategoryNav = document.getElementById('subcategoryNav');
    const subcategoryButtons = document.getElementById('subcategoryButtons');
    
    if (!category || !category.subcategories || category.subcategories.length === 0) {
        subcategoryNav.style.display = 'none';
        return;
    }
    
    // Mostrar navegação de subcategorias
    subcategoryNav.style.display = 'block';
    
    subcategoryButtons.innerHTML = `
        <button class="subcategory-btn active" onclick="loadAllSubcategoryProducts('${categoryId}')">
            <i class="fas fa-th-large"></i> Todos
        </button>
        ${category.subcategories.map(subcategory => `
            <button class="subcategory-btn" onclick="loadProductsBySubcategory('${categoryId}', '${subcategory}')">
                <i class="fas fa-tag"></i> ${subcategory}
            </button>
        `).join('')}
    `;
}

async function loadAllSubcategoryProducts(categoryId) {
    try {
        showLoading();
        STATE.currentSubcategory = null;
        await loadProducts(categoryId);
        
        // Atualizar título
        const category = STATE.categories.find(cat => cat.id === categoryId);
        const title = document.getElementById('categoryTitle');
        if (title && category) {
            title.textContent = category.name;
        }
        
        // Atualizar botões ativos
        document.querySelectorAll('.subcategory-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Ativar botão "Todos"
        const allButtons = document.querySelectorAll('.subcategory-btn');
        if (allButtons.length > 0) {
            allButtons[0].classList.add('active');
        }
        
    } catch (error) {
        console.error('Erro ao carregar todos os produtos:', error);
        showMessage('Erro ao carregar produtos.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadProductsBySubcategory(categoryId, subcategory) {
    try {
        showLoading();
        STATE.currentCategory = categoryId;
        STATE.currentSubcategory = subcategory;
        
        // Primeiro carrega todos os produtos da categoria
        await loadProducts(categoryId);
        
        // Depois filtra pela subcategoria no JavaScript
        if (STATE.products.length > 0) {
            const filteredProducts = STATE.products.filter(product => 
                product.subcategory === subcategory
            );
            displayFilteredProducts(filteredProducts, subcategory);
        }
        
        // Atualizar botões ativos
        document.querySelectorAll('.subcategory-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Ativar o botão da subcategoria clicada
        const subcategoryButtons = document.querySelectorAll('.subcategory-btn');
        subcategoryButtons.forEach(btn => {
            if (btn.textContent.includes(subcategory)) {
                btn.classList.add('active');
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar produtos da subcategoria:', error);
        showMessage('Erro ao carregar produtos.', 'error');
    } finally {
        hideLoading();
    }
}

function displayFilteredProducts(products, subcategory) {
    const container = document.getElementById('selectedCategoryProducts');
    const title = document.getElementById('categoryTitle');
    
    if (!container) return;

    const currentCategory = STATE.categories.find(cat => cat.id === STATE.currentCategory);
    if (title) {
        title.textContent = `${currentCategory ? currentCategory.name : 'Produtos'} - ${subcategory}`;
    }

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Nenhum produto na subcategoria "${subcategory}"</p>
            </div>
        `;
        return;
    }

    displayProductsList(products);
}

function displayProducts() {
    const container = document.getElementById('selectedCategoryProducts');
    const title = document.getElementById('categoryTitle');
    
    if (!container) return;

    const currentCategory = STATE.categories.find(cat => cat.id === STATE.currentCategory);
    if (title) {
        if (STATE.currentSubcategory) {
            title.textContent = `${currentCategory ? currentCategory.name : 'Produtos'} - ${STATE.currentSubcategory}`;
        } else {
            title.textContent = currentCategory ? currentCategory.name : 'Todos os Produtos';
        }
    }

    if (STATE.products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente outra categoria ou volte mais tarde</p>
            </div>
        `;
        return;
    }

    displayProductsList(STATE.products);
}



function displayProductsList(products) {
    const container = document.getElementById('selectedCategoryProducts');
    if (!container) return;

    container.innerHTML = products.map(product => {
        const category = STATE.categories.find(cat => cat.id === product.categoryId);
        const isOutOfStock = product.stock <= 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${product.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Não+Encontrada'"
                     onclick="showProductDetails('${product.id}')">
                
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">R$ ${formatPrice(product.price)}</div>
                    
                    ${product.description ? `
                        <p class="product-description">${product.description.substring(0, 100)}...</p>
                    ` : ''}
                    
                    <div class="product-meta">
                        <span class="product-category">${category?.name || 'Geral'}</span>
                        ${product.subcategory ? `<span class="product-subcategory">${product.subcategory}</span>` : ''}
                        <span class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                            ${isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
                        </span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-secondary" onclick="showProductDetails('${product.id}')">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                       <button class="btn-primary" 
        onclick="addToCartWithTracking('${product.id}')" 
        ${isOutOfStock ? 'disabled' : ''}>
    <i class="fas fa-shopping-bag"></i> 
    ${isOutOfStock ? 'Esgotado' : 'Comprar'}
</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== PRODUTOS EXCLUSIVOS E EM DESTAQUE =====
async function loadExclusiveProducts() {
    try {
        const snapshot = await db.collection('products')
            .where('exclusive', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(8)
            .get();
            
        const exclusiveProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filtrar produtos com estoque no JavaScript
        const exclusiveWithStock = exclusiveProducts.filter(product => 
            product.stock > 0
        );

        displayExclusiveProducts(exclusiveWithStock);
    } catch (error) {
        console.error('Erro ao carregar produtos exclusivos:', error);
    }
}

async function loadFeaturedProducts() {
    try {
        const snapshot = await db.collection('products')
            .where('featured', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(8)
            .get();
            
        const featuredProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filtrar produtos com estoque no JavaScript
        const featuredWithStock = featuredProducts.filter(product => 
            product.stock > 0
        );

        displayFeaturedProducts(featuredWithStock);
    } catch (error) {
        console.error('Erro ao carregar produtos em destaque:', error);
    }
}

function displayExclusiveProducts(products) {
    const container = document.getElementById('exclusiveProducts');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-crown"></i>
                <h3>Nenhum produto exclusivo</h3>
                <p>Em breve novidades especiais!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const isOutOfStock = product.stock <= 0;
        return `
            <div class="product-card exclusive-card ${isOutOfStock ? 'out-of-stock-card' : ''}">
                <div class="exclusive-badge">🎯 Exclusivo</div>
                ${isOutOfStock ? '<div class="out-of-stock-overlay">Esgotado</div>' : ''}
                <img src="${product.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}" 
                     alt="${product.name}" 
                     class="product-image ${isOutOfStock ? 'grayscale' : ''}"
                     onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Não+Encontrada'"
                     onclick="${isOutOfStock ? '' : `showProductDetails('${product.id}')`}">
                
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">R$ ${formatPrice(product.price)}</div>
                    
                    <div class="product-meta">
                        <span class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                            ${isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
                        </span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-secondary" onclick="showProductDetails('${product.id}')">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                        <button class="btn-primary" onclick="addToCart('${product.id}')" 
                                ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-bag"></i> 
                            ${isOutOfStock ? 'Esgotado' : 'Comprar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayFeaturedProducts(products) {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <h3>Nenhum destaque no momento</h3>
                <p>Volte em breve para ver novidades!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const isOutOfStock = product.stock <= 0;
        return `
            <div class="product-card featured-card ${isOutOfStock ? 'out-of-stock-card' : ''}">
                <div class="featured-badge">⭐ Destaque</div>
                ${isOutOfStock ? '<div class="out-of-stock-overlay">Esgotado</div>' : ''}
                <img src="${product.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}" 
                     alt="${product.name}" 
                     class="product-image ${isOutOfStock ? 'grayscale' : ''}"
                     onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Não+Encontrada'"
                     onclick="${isOutOfStock ? '' : `showProductDetails('${product.id}')`}">
                
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">R$ ${formatPrice(product.price)}</div>
                    
                    <div class="product-meta">
                        <span class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                            ${isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
                        </span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-secondary" onclick="showProductDetails('${product.id}')">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                        <button class="btn-primary" onclick="addToCart('${product.id}')" 
                                ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-bag"></i> 
                            ${isOutOfStock ? 'Esgotado' : 'Comprar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== FUNÇÕES DE COMPATIBILIDADE =====
function loadCategory(categoryName) {
    // Função de compatibilidade com o HTML antigo
    const category = STATE.categories.find(cat => 
        cat.name.toLowerCase().includes(categoryName.toLowerCase().replace('produtoscat', ''))
    );
    
    if (category) {
        loadProductsByCategory(category.id);
    } else {
        // Fallback: carrega a primeira categoria
        if (STATE.categories.length > 0) {
            loadProductsByCategory(STATE.categories[0].id);
        }
    }
}

// ===== FUNÇÕES DO CARRINHO =====
function toggleCart() {
    console.log('🛒 Alternando estado do carrinho');
    const cart = document.getElementById('cartSidebar');
    const overlay = document.querySelector('.overlay');
    
    STATE.isCartOpen = !STATE.isCartOpen;
    
    if (STATE.isCartOpen) {
        cart.classList.add('open');
        createOverlay();
        console.log('✅ Carrinho aberto');
    } else {
        cart.classList.remove('open');
        removeOverlay();
        console.log('❌ Carrinho fechado');
    }
}

function openCheckoutModal() {
    console.log('💰 Abrindo modal de checkout');
    if (STATE.cart.length === 0) {
        showMessage('Adicione produtos ao carrinho antes de finalizar.', 'warning');
        return;
    }
    document.getElementById('checkoutModal').classList.add('open');
    createOverlay();
    console.log('✅ Modal de checkout aberto');
}

function closeCheckoutModal() {
    console.log('❌ Fechando modal de checkout');
    document.getElementById('checkoutModal').classList.remove('open');
    removeOverlay();
}

function handleDeliveryOptionChange() {
    const deliveryOption = document.getElementById('deliveryOption').value;
    const addressFields = document.getElementById('addressFields');
    
    if (addressFields) {
        addressFields.style.display = deliveryOption === 'delivery' ? 'block' : 'none';
        console.log('🚚 Opção de entrega alterada:', deliveryOption);
    }
}

function showTrocoField() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const trocoContainer = document.getElementById('trocoContainer');
    
    if (trocoContainer) {
        trocoContainer.style.display = paymentMethod === 'Dinheiro' ? 'block' : 'none';
        console.log('💵 Campo de troco:', paymentMethod === 'Dinheiro' ? 'visível' : 'oculto');
    }
}

// ===== FUNÇÕES DE OVERLAY =====
function createOverlay() {
    let overlay = document.querySelector('.overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.onclick = closeAllModals;
        document.body.appendChild(overlay);
        console.log('🎭 Overlay criado');
    }
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('✅ Overlay ativado');
}

function removeOverlay() {
    const overlay = document.querySelector('.overlay');
    
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        console.log('❌ Overlay removido');
    }
}

function closeAllModals() {
    console.log('🚪 Fechando todos os modais');
    
    // Fechar modais
    document.querySelectorAll('.modal.open').forEach(modal => {
        modal.classList.remove('open');
    });
    
    // Fechar carrinho
    const cart = document.getElementById('cartSidebar');
    if (cart) {
        cart.classList.remove('open');
        STATE.isCartOpen = false;
    }
    
    removeOverlay();
    console.log('✅ Todos os modais fechados');
}

// ===== FINALIZAÇÃO DE PEDIDO =====
function confirmPurchase() {
    console.log('🛍️ Confirmando compra');
    
    const name = document.getElementById('name')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const deliveryOption = document.getElementById('deliveryOption')?.value;
    const troco = document.getElementById('troco')?.value;

    // Validações
    if (!name) {
        showMessage('Digite seu nome', 'warning');
        return;
    }

    if (deliveryOption === 'delivery' && !address) {
        showMessage('Digite o endereço de entrega', 'warning');
        return;
    }

    if (deliveryOption === 'none') {
        showMessage('Selecione o tipo de entrega', 'warning');
        return;
    }

    try {
        const message = generateWhatsAppMessage({
            name, address, paymentMethod, deliveryOption, troco
        });

        const whatsappNumber = STATE.storeConfig.whatsapp || CONFIG.defaultStoreConfig.whatsapp;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        console.log('📤 Abrindo WhatsApp com pedido');
        window.open(whatsappUrl, '_blank');
        
        closeCheckoutModal();
        clearCart();
        
        showMessage('✅ Pedido enviado com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao finalizar pedido:', error);
        showMessage('Erro ao enviar pedido. Tente novamente.', 'error');
    }
}

function generateWhatsAppMessage(formData) {
    const { name, address, paymentMethod, deliveryOption, troco } = formData;
    
    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryOption === 'delivery' ? (STATE.storeConfig.deliveryFee || 2.00) : 0;
    const total = subtotal + deliveryFee;
    
    let message = `🛍️ *NOVO PEDIDO - ${STATE.storeConfig.name || 'Loja Virtual'}*\n\n`;
    message += `👤 *Cliente:* ${name}\n`;
    message += `📍 *Entrega:* ${deliveryOption === 'delivery' ? 'Entrega' : 'Retirada'}\n`;
    
    if (deliveryOption === 'delivery' && address) {
        message += `🏠 *Endereço:* ${address}\n`;
    }
    
    message += `💳 *Pagamento:* ${getPaymentMethodName(paymentMethod)}\n`;
    
    if (paymentMethod === 'Dinheiro' && troco) {
        message += `💰 *Troco para:* R$ ${formatPrice(parseFloat(troco))}\n`;
    }
    
    message += `\n📦 *ITENS DO PEDIDO:*\n`;
    
    STATE.cart.forEach(item => {
        message += `• ${item.name} - ${item.quantity}x - R$ ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    message += `\n💵 *Subtotal:* R$ ${formatPrice(subtotal)}\n`;
    
    if (deliveryOption === 'delivery') {
        message += `🚚 *Taxa de Entrega:* R$ ${formatPrice(deliveryFee)}\n`;
    }
    
    message += `💰 *Total:* R$ ${formatPrice(total)}\n\n`;
    message += `⏰ *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n`;
    message += `🔔 _Pedido gerado automaticamente via loja virtual_`;
    
    console.log('📝 Mensagem do WhatsApp gerada');
    return message;
}

function getPaymentMethodName(method) {
    const methods = {
        'Cartao': 'Cartão',
        'Dinheiro': 'Dinheiro', 
        'Pix': 'PIX'
    };
    return methods[method] || method;
}

function clearCart() {
    console.log('🧹 Limpando carrinho');
    STATE.cart = [];
    updateCartUI();
    localStorage.removeItem('shoppingCart');
    showMessage('Carrinho limpo!', 'info');
}

// ===== VERIFICAÇÃO DE FUNÇÕES =====
function verifyAllFunctions() {
    console.log('🔧 VERIFICAÇÃO DE FUNÇÕES:');
    console.log('toggleCart:', typeof toggleCart === 'function');
    console.log('addToCart:', typeof addToCart === 'function');
    console.log('removeFromCart:', typeof removeFromCart === 'function');
    console.log('updateCartItemQuantity:', typeof updateCartItemQuantity === 'function');
    console.log('openCheckoutModal:', typeof openCheckoutModal === 'function');
    console.log('closeCheckoutModal:', typeof closeCheckoutModal === 'function');
    console.log('confirmPurchase:', typeof confirmPurchase === 'function');
    console.log('closeAllModals:', typeof closeAllModals === 'function');
    console.log('createOverlay:', typeof createOverlay === 'function');
    console.log('removeOverlay:', typeof removeOverlay === 'function');
     console.log('showProductDetails:', typeof showProductDetails === 'function');
    console.log('closeProductModal:', typeof closeProductModal === 'function');
    console.log('addToCartFromDetail:', typeof addToCartFromDetail === 'function');
    console.log('increaseDetailQuantity:', typeof increaseDetailQuantity === 'function');
    console.log('decreaseDetailQuantity:', typeof decreaseDetailQuantity === 'function');
}

// Executar verificação quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(verifyAllFunctions, 1000);
});


// ===== DETALHES DO PRODUTO =====
function showProductDetails(productId) {
    console.log('🔍 Mostrando detalhes do produto:', productId);
    
    const product = STATE.products.find(p => p.id === productId);
    
    if (!product) {
        console.error('❌ Produto não encontrado:', productId);
        showMessage('Produto não encontrado.', 'error');
        return;
    }

    const category = STATE.categories.find(cat => cat.id === product.categoryId);
    const modal = document.getElementById('productModal');
    
    if (!modal) {
        console.error('❌ Modal de detalhes não encontrado');
        showMessage('Erro ao carregar detalhes do produto.', 'error');
        return;
    }

    // Criar conteúdo do modal
    modal.innerHTML = `
        <div class="modal-content product-modal-content">
            <div class="modal-header">
                <h3>Detalhes do Produto</h3>
                <button class="close-modal" onclick="closeProductModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="product-detail-container">
                    <div class="product-detail-image-section">
                        <img src="${product.imageURL || 'https://via.placeholder.com/400x400?text=Produto'}" 
                             alt="${product.name}" 
                             class="product-detail-image"
                             onerror="this.src='https://via.placeholder.com/400x400?text=Imagem+Não+Encontrada'">
                        
                        <!-- Badges -->
                        <div class="product-detail-badges">
                            ${product.featured ? '<span class="badge featured-badge">⭐ Destaque</span>' : ''}
                            ${product.exclusive ? '<span class="badge exclusive-badge">🎯 Exclusivo</span>' : ''}
                            ${product.stock <= 0 ? '<span class="badge out-of-stock-badge">Esgotado</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="product-detail-info">
                        <h2 class="product-detail-title">${product.name}</h2>
                        
                        <div class="product-detail-price">R$ ${formatPrice(product.price)}</div>
                        
                        <div class="product-detail-meta">
                            <div class="meta-item">
                                <strong>Categoria:</strong>
                                <span>${category?.name || 'Geral'}</span>
                            </div>
                            
                            ${product.subcategory ? `
                                <div class="meta-item">
                                    <strong>Subcategoria:</strong>
                                    <span>${product.subcategory}</span>
                                </div>
                            ` : ''}
                            
                            <div class="meta-item">
                                <strong>Estoque:</strong>
                                <span class="${product.stock <= 0 ? 'out-of-stock' : 'in-stock'}">
                                    ${product.stock <= 0 ? 'Esgotado' : `${product.stock} unidades disponíveis`}
                                </span>
                            </div>
                        </div>
                        
                       ${product.description ? `
    <div class="product-description-section">
        <h4><i class="fas fa-gem"></i> Detalhes da Joia</h4>
        <div class="product-description-text jewelry-description">
            ${formatJewelryDescription(product.description)}
        </div>
    </div>
` : '<p class="no-description">Este produto não possui descrição.</p>'}

                        <div class="product-detail-actions">
                            <div class="quantity-selector">
                                <label for="detailQuantity">Quantidade:</label>
                                <div class="quantity-controls">
                                    <button class="quantity-btn" onclick="decreaseDetailQuantity()">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <input type="number" 
                                           id="detailQuantity" 
                                           class="quantity-input" 
                                           value="1" 
                                           min="1" 
                                           max="${product.stock}">
                                    <button class="quantity-btn" onclick="increaseDetailQuantity()">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <button class="btn-primary large-btn" 
                                    onclick="addToCartFromDetail('${product.id}')" 
                                    ${product.stock <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-shopping-bag"></i>
                                ${product.stock <= 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Resetar quantidade para 1
    STATE.detailQuantity = 1;
    
    modal.classList.add('open');
    createOverlay();
    console.log('✅ Modal de detalhes aberto');
}


// Adicione emojis automáticos baseados em palavras-chave
function addJewelryEmojis(text) {
    const emojiKeywords = {
        'diamante|diamantes': '💎',
        'ouro': '🟡',
        'prata': '⚪',
        'anel|aliança': '💍',
        'colar|gargantilha': '📿',
        'brinco': '🔗',
        'pulseira|bracelete': '📿',
        'relógio': '⌚',
        'presente|presentear': '🎁',
        'luxo|exclusivo': '👑',
        'garantia|certificado': '📜',
        'entrega|frete': '🚚'
    };
    
    let result = text;
    
    Object.keys(emojiKeywords).forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        result = result.replace(regex, `${emojiKeywords[keyword]} $1`);
    });
    
    return result;
}
// ===== FORMATADOR DE DESCRIÇÃO PARA JOIAS =====
function formatJewelryDescription(description) {
    if (!description) return '';
    
    let formatted = description;
    
    // 1. Substituir quebras de linha por <br> ou <p>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // 2. Detectar e formatar listas
    // Para listas com marcadores como *, -, •, ✓
    formatted = formatted.replace(/(\*|\-|\•|\✓)\s+(.+?)(?=\n|$)/g, 
        '<li><span class="jewelry-list-icon">•</span>$2</li>');
    
    // 3. Envolver parágrafos em <p>
    const paragraphs = formatted.split('<br><br>');
    formatted = paragraphs.map(p => {
        if (p.trim()) {
            // Se parece com uma lista, manter como está
            if (p.includes('<li>')) {
                return `<ul class="jewelry-features-list">${p}</ul>`;
            }
            return `<p class="jewelry-paragraph">${p}</p>`;
        }
        return '';
    }).join('');
    
    // 4. Formatar títulos dentro da descrição
    formatted = formatted.replace(/\[(.*?)\]/g, 
        '<h4 class="jewelry-subtitle">$1</h4>');
    
    // 5. Destacar especificações técnicas
    const techTerms = ['ouro', 'prata', 'quilate', 'ct', 'gramas', 'g', 'cm', 'mm', 'diamante', 'rubi', 'esmeralda', 'safira', 'pérola'];
    techTerms.forEach(term => {
        const regex = new RegExp(`\\b(${term}s?|${term.toUpperCase()}S?)\\b`, 'gi');
        formatted = formatted.replace(regex, '<strong class="tech-term">$1</strong>');
    });
    
    // 6. Adicionar emojis para características especiais
    const emojiMap = {
        'brilhante|brilho|brilha': '✨',
        'luxo|luxuoso|sofisticado': '👑',
        'presente|presentear|presenteável': '🎁',
        'exclusivo|exclusividade|limitado': '⭐',
        'garantia|certificado|autenticidade': '🏅',
        'entrega grátis|frete grátis': '🚚',
        'promoção|ofertas|desconto': '💎'
    };
    
    Object.keys(emojiMap).forEach(pattern => {
        const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
        formatted = formatted.replace(regex, 
            (match, p1) => `${emojiMap[pattern]} ${match} ${emojiMap[pattern]}`);
    });
    
    return formatted;
}
function closeProductModal() {
    console.log('❌ Fechando modal de detalhes');
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('open');
    }
    removeOverlay();
}

// Funções para controlar quantidade no modal
function increaseDetailQuantity() {
    const input = document.getElementById('detailQuantity');
    const productId = getCurrentDetailProductId();
    const product = STATE.products.find(p => p.id === productId);
    
    if (input && product) {
        const currentValue = parseInt(input.value);
        const newValue = currentValue + 1;
        
        if (newValue <= product.stock) {
            input.value = newValue;
            STATE.detailQuantity = newValue;
        } else {
            showMessage('Quantidade máxima em estoque atingida.', 'warning');
        }
    }
}

function decreaseDetailQuantity() {
    const input = document.getElementById('detailQuantity');
    
    if (input) {
        const currentValue = parseInt(input.value);
        const newValue = Math.max(1, currentValue - 1);
        
        input.value = newValue;
        STATE.detailQuantity = newValue;
    }
}
// ===== ADICIONAR AO CARRINHO DO MODAL DE DETALHES COM TRACKING =====
function addToCartFromDetail(productId) {
    console.log('🛒 Adicionando ao carrinho do modal:', productId);
    
    // Obter quantidade do input
    const quantityInput = document.getElementById('detailQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    if (isNaN(quantity) || quantity < 1) {
        showMessage('Quantidade inválida!', 'error');
        return;
    }
    
    const product = STATE.products.find(p => p.id === productId);
    
    if (!product) {
        console.error('❌ Produto não encontrado:', productId);
        showMessage('Produto não encontrado.', 'error');
        return;
    }

    // Verificar se o produto está em estoque
    if (product.stock <= 0) {
        console.log('⚠️ Produto fora de estoque:', product.name);
        showMessage('Produto fora de estoque.', 'warning');
        return;
    }

    // Verificar se a quantidade solicitada está disponível
    if (quantity > product.stock) {
        console.log('📦 Quantidade excede estoque:', product.name);
        showMessage(`Apenas ${product.stock} unidades disponíveis.`, 'warning');
        return;
    }

    // Verificar se o produto já está no carrinho
    const existingItem = STATE.cart.find(item => item.id === productId);
    
    if (existingItem) {
        // Verificar se não excede o estoque com a nova quantidade
        if (existingItem.quantity + quantity > product.stock) {
            const available = product.stock - existingItem.quantity;
            console.log('📦 Quantidade máxima em estoque atingida:', product.name);
            showMessage(`Você pode adicionar no máximo ${available} unidades.`, 'warning');
            return;
        }
        // Incrementar quantidade
        existingItem.quantity += quantity;
        console.log('➕ Quantidade incrementada:', product.name, 'Nova quantidade:', existingItem.quantity);
    } else {
        // Adicionar novo item ao carrinho
        STATE.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageURL: product.imageURL,
            stock: product.stock,
            quantity: quantity,
            cartId: generateId()
        });
        console.log('🆕 Novo produto adicionado ao carrinho:', product.name);
    }

    // Atualizar estoque localmente (opcional, se quiser refletir imediatamente)
    // product.stock -= quantity;
    
    // Registrar múltiplos cliques de tracking (um para cada unidade)
    for (let i = 0; i < quantity; i++) {
        trackPurchaseClick(productId).catch(error => {
            console.warn('Aviso: Tracking falhou:', error);
        });
    }

    // Atualizar interface do carrinho
    updateCartUI();
    
    // Mostrar mensagem de sucesso
    if (quantity === 1) {
        showMessage('✅ ' + product.name + ' adicionado ao carrinho!', 'success');
    } else {
        showMessage(`✅ ${quantity} unidades de ${product.name} adicionadas ao carrinho!`, 'success');
    }
    
    // Salvar carrinho no localStorage
    cacheData('shoppingCart', STATE.cart);
    
    // Fechar o modal após adicionar (opcional)
    // setTimeout(() => {
    //     closeProductModal();
    // }, 1500);
}

// Função auxiliar para obter o ID do produto atual no modal
function getCurrentDetailProductId() {
    const addButton = document.querySelector('.btn-primary.large-btn');
    if (addButton && addButton.onclick) {
        const onclickText = addButton.onclick.toString();
        const match = onclickText.match(/addToCartFromDetail\('([^']+)'\)/);
        return match ? match[1] : null;
    }
    return null;
}


function loadCachedData() {
    try {
        const cachedConfig = localStorage.getItem('storeConfig');
        const cachedCategories = localStorage.getItem('categories');
        const cachedProducts = localStorage.getItem('products');
        const cachedCart = localStorage.getItem('shoppingCart');
        
        if (cachedConfig) {
            STATE.storeConfig = JSON.parse(cachedConfig);
            updateStoreUI();
        }
        
        if (cachedCategories) {
            STATE.categories = JSON.parse(cachedCategories);
            displayCategories();
        }
        
        if (cachedProducts) {
            STATE.products = JSON.parse(cachedProducts);
            displayProducts();
        }
        
        if (cachedCart) {
            STATE.cart = JSON.parse(cachedCart);
            updateCartUI();
        }
        
        console.log('💾 Dados em cache carregados');
    } catch (error) {
        console.error('Erro ao carregar cache:', error);
    }
}


// ===== ATUALIZAR INTERFACE DA LOJA =====
function updateStoreUI() {
    console.log('🎨 Atualizando interface da loja...');
    
    // Atualizar nome da loja
    const storeName = document.getElementById('profileName');
    if (storeName && STATE.storeConfig.name) {
        storeName.textContent = STATE.storeConfig.name;
        console.log('🏷️ Nome da loja atualizado:', STATE.storeConfig.name);
    }

    // Atualizar título da página
    if (STATE.storeConfig.name) {
        document.title = STATE.storeConfig.name + ' - Loja Virtual';
        console.log('📄 Título da página atualizado');
    }

    // Atualizar descrição SEO
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && STATE.storeConfig.description) {
        metaDesc.setAttribute('content', STATE.storeConfig.description);
        console.log('🔍 Meta description atualizada');
    }

    // Atualizar logotipo
    loadStoreLogo();
}

// ===== CARREGAR LOGOTIPO =====
async function loadStoreLogo() {
    try {
        console.log('🏪 Carregando logotipo da loja...');
        
        // Se já temos a URL no storeConfig, usar ela
        if (STATE.storeConfig.logoUrl) {
            const logoImg = document.getElementById('profileImage');
            if (logoImg) {
                // Adicionar timestamp para evitar cache
                const timestamp = new Date().getTime();
                const logoUrlWithCache = `${STATE.storeConfig.logoUrl}?t=${timestamp}`;
                
                // Verificar se a imagem carrega
                const tempImage = new Image();
                
                tempImage.onload = function() {
                    logoImg.src = logoUrlWithCache;
                    logoImg.style.display = 'block';
                    logoImg.alt = STATE.storeConfig.name || 'Logotipo da Loja';
                    console.log('✅ Logotipo exibido na loja');
                };
                
                tempImage.onerror = function() {
                    console.error('❌ Erro ao carregar logotipo');
                    logoImg.style.display = 'none';
                };
                
                tempImage.src = logoUrlWithCache;
            }
        } else {
            console.log('ℹ️ Nenhum logotipo configurado');
            const logoImg = document.getElementById('profileImage');
            if (logoImg) {
                logoImg.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar logotipo:', error);
    }
}


// ===== CONFIGURAÇÃO DE EVENTOS =====
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // Carrega carrinho salvo
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
        try {
            STATE.cart = JSON.parse(savedCart);
            updateCartUI();
        } catch (error) {
            console.error('Erro ao carregar carrinho salvo:', error);
        }
    }

    // Listeners em tempo real
    if (STATE.isOnline) {
        setupRealtimeListeners();
    }
}

function setupRealtimeListeners() {
    db.collection('config').doc('store')
        .onSnapshot((doc) => {
            if (doc.exists) {
                STATE.storeConfig = { ...CONFIG.defaultStoreConfig, ...doc.data() };
                cacheData('storeConfig', STATE.storeConfig);
                updateStoreUI();
            }
        });

    db.collection('categories')
        .onSnapshot((snapshot) => {
            STATE.categories = [];
            snapshot.forEach(doc => {
                STATE.categories.push({ id: doc.id, ...doc.data() });
            });
            cacheData('categories', STATE.categories);
            displayCategories();
        });

    db.collection('products')
        .onSnapshot((snapshot) => {
            STATE.products = [];
            snapshot.forEach(doc => {
                STATE.products.push({ id: doc.id, ...doc.data() });
            });
            cacheData('products', STATE.products);
            displayProducts();
        });
}

// ===== UTILITÁRIOS =====
function formatPrice(price) {
    if (typeof price !== 'number') return '0,00';
    return price.toFixed(2).replace('.', ',');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}
function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#dc3545' : 
                     type === 'warning' ? '#ffc107' : 
                     type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(messageEl);

    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 5000);
}

function cacheData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Erro ao salvar cache:', error);
    }
}

// ===== ADMIN =====
function goToAdminPage() {
    window.open('pgadm.html', '_blank');
}

// Adicione CSS para as subcategorias
const style = document.createElement('style');
style.textContent = `
    /* ===== SUBCATEGORIAS ===== */
    .subcategory-nav {
        background: var(--gray-50);
        padding: 20px 0;
        border-bottom: 1px solid var(--gray-200);
        margin-bottom: 30px;
    }

    .subcategory-buttons {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 10px 0;
        scrollbar-width: none;
    }

    .subcategory-buttons::-webkit-scrollbar {
        display: none;
    }

    .subcategory-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: var(--white);
        border: 2px solid var(--gray-300);
        border-radius: 25px;
        color: var(--gray-700);
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
        white-space: nowrap;
        flex-shrink: 0;
        font-size: 0.9rem;
    }

    .subcategory-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-2px);
    }

    .subcategory-btn.active {
        background: var(--primary);
        border-color: var(--primary);
        color: var(--white);
        box-shadow: var(--shadow-sm);
    }

    .product-subcategory {
        background: var(--primary-light);
        color: var(--primary-dark);
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .loading {
        pointer-events: none;
        opacity: 0.7;
    }
    
    .empty-state, .empty-cart {
        text-align: center;
        padding: 60px 20px;
        color: var(--gray-500);
    }
    
    .empty-state i, .empty-cart i {
        font-size: 4rem;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .product-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .in-stock { color: #28a745; }
    .out-of-stock { color: #dc3545; }

    /* Estilos para produtos esgotados */
    .out-of-stock-card {
        opacity: 0.7;
        position: relative;
    }

    .out-of-stock-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(220, 53, 69, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 3;
        text-transform: uppercase;
        font-size: 0.875rem;
    }

    .grayscale {
        filter: grayscale(100%);
    }

    .out-of-stock-card .product-image {
        opacity: 0.6;
    }

    .out-of-stock-card .btn-primary:disabled {
        background: var(--gray-400);
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);
// ===== CARRINHO DE COMPRAS COM TRACKING INTEGRADO =====
let lastClickTime = 0;
const CLICK_DELAY = 500; // 500ms entre cliques

function addToCart(productId) {
    // Prevenir cliques rápidos duplicados
    const now = Date.now();
    if (now - lastClickTime < CLICK_DELAY) {
        console.log('⏳ Aguarde antes de clicar novamente');
        return;
    }
    lastClickTime = now;
    
    console.log('🛒 Tentando adicionar produto ao carrinho:', productId);
    
    // Encontrar o produto na lista de produtos
    const product = STATE.products.find(p => p.id === productId);
    
    if (!product) {
        console.error('❌ Produto não encontrado:', productId);
        showMessage('Produto não encontrado.', 'error');
        return;
    }

    // Verificar se o produto está em estoque
    if (product.stock <= 0) {
        console.log('⚠️ Produto fora de estoque:', product.name);
        showMessage('Produto fora de estoque.', 'warning');
        return;
    }

    // Verificar se o produto já está no carrinho
    const existingItem = STATE.cart.find(item => item.id === productId);
    
    if (existingItem) {
        // Verificar se não excede o estoque
        if (existingItem.quantity >= product.stock) {
            console.log('📦 Quantidade máxima em estoque atingida:', product.name);
            showMessage('Quantidade máxima em estoque atingida.', 'warning');
            return;
        }
        // Incrementar quantidade
        existingItem.quantity++;
        console.log('➕ Quantidade incrementada:', product.name, 'Nova quantidade:', existingItem.quantity);
    } else {
        // Adicionar novo item ao carrinho
        STATE.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageURL: product.imageURL,
            stock: product.stock,
            quantity: 1,
            cartId: generateId() // ID único para o item no carrinho
        });
        console.log('🆕 Novo produto adicionado ao carrinho:', product.name);
    }

    // Registrar o clique para estatísticas (não-bloqueante)
    trackPurchaseClick(productId).catch(error => {
        console.warn('Aviso: Tracking falhou:', error);
    });

    // Atualizar interface do carrinho
    updateCartUI();
    
    // Mostrar mensagem de sucesso
    showMessage('✅ ' + product.name + ' adicionado ao carrinho!', 'success');
    
    // Salvar carrinho no localStorage
    cacheData('shoppingCart', STATE.cart);
}

// Remova a função addToCartWithTracking se não for mais necessária
// ou mantenha-a apenas como um wrapper:
function addToCartWithTracking(productId) {
    addToCart(productId);
}


// ===== FUNÇÃO DE TRACKING DE CLICKS NO BOTÃO COMPRAR =====
async function trackPurchaseClick(productId) {
    try {
        // Verificar se o produto existe no STATE
        const product = STATE.products.find(p => p.id === productId);
        if (!product) return false;
        
        // Dados do clique
        const clickData = {
            productId: productId,
            productName: product.name,
            price: product.price,
            category: STATE.categories.find(cat => cat.id === product.categoryId)?.name || 'Geral',
            timestamp: new Date().toISOString(),
            sessionId: getSessionId(),
            userAgent: navigator.userAgent.substring(0, 200), // Limitar tamanho
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            referrer: document.referrer || 'direct'
        };
        
        console.log('📊 Registrando clique no produto:', product.name);
        
        // Opção 1: Salvar no LocalStorage (para fallback)
        saveClickToLocalStorage(clickData);
        
        // Opção 2: Enviar para API/Firebase (se configurado)
        if (window.firebaseConfig) {
            await sendClickToFirebase(clickData);
        } else {
            // Enviar para um endpoint simples
            await sendClickToAPI(clickData);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro no tracking:', error);
        // Não interromper o fluxo de compra em caso de erro no tracking
        return false;
    }
}

// ===== FUNÇÕES AUXILIARES PARA TRACKING =====

// Gerar/obter session ID
function getSessionId() {
    let sessionId = localStorage.getItem('userSessionId');
    if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userSessionId', sessionId);
    }
    return sessionId;
}

// Salvar no LocalStorage (fallback)
function saveClickToLocalStorage(clickData) {
    try {
        // Obter cliques existentes
        const clicks = JSON.parse(localStorage.getItem('productClicks') || '[]');
        
        // Adicionar novo clique
        clicks.push({
            ...clickData,
            localTimestamp: new Date().getTime()
        });
        
        // Manter apenas os últimos 1000 cliques para não sobrecarregar
        if (clicks.length > 1000) {
            clicks.splice(0, clicks.length - 1000);
        }
        
        // Salvar de volta
        localStorage.setItem('productClicks', JSON.stringify(clicks));
        
        // Também salvar contagem por produto
        updateProductClickCount(clickData.productId, clickData.productName);
        
        console.log('📝 Clique salvo localmente:', clickData.productName);
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

// Atualizar contagem por produto no LocalStorage
function updateProductClickCount(productId, productName) {
    try {
        const productStats = JSON.parse(localStorage.getItem('productStats') || '{}');
        
        if (!productStats[productId]) {
            productStats[productId] = {
                productName: productName,
                clickCount: 0,
                firstClick: new Date().toISOString(),
                lastClick: new Date().toISOString()
            };
        }
        
        productStats[productId].clickCount++;
        productStats[productId].lastClick = new Date().toISOString();
        
        localStorage.setItem('productStats', JSON.stringify(productStats));
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Enviar para Firebase (se configurado)
async function sendClickToFirebase(clickData) {
    // Implementação do Firebase
    // Descomente se tiver Firebase configurado
    /*
    if (!window.firebaseApp) return;
    
    const db = getFirestore();
    const clickRef = doc(collection(db, 'productClicks'));
    
    await setDoc(clickRef, {
        ...clickData,
        serverTimestamp: serverTimestamp()
    });
    */
}

// Enviar para API endpoint
async function sendClickToAPI(clickData) {
    try {
        // Usar Beacon API para envio confiável (não bloqueia navegação)
        const blob = new Blob([JSON.stringify(clickData)], {type: 'application/json'});
        
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track-click', blob);
        } else {
            // Fallback para fetch
            fetch('/api/track-click', {
                method: 'POST',
                body: JSON.stringify(clickData),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true // Mantém a requisição mesmo após sair da página
            });
        }
    } catch (error) {
        console.error('Erro ao enviar para API:', error);
    }
}


function removeFromCart(cartId) {
    console.log('🗑️ Removendo item do carrinho:', cartId);
    
    STATE.cart = STATE.cart.filter(item => item.cartId !== cartId);
    updateCartUI();
    showMessage('Produto removido do carrinho.', 'info');
    cacheData('shoppingCart', STATE.cart);
}


function updateCartItemQuantity(cartId, change) {
    console.log('🔄 Atualizando quantidade do item:', cartId, 'Mudança:', change);
    
    const item = STATE.cart.find(item => item.cartId === cartId);
    
    if (!item) {
        console.error('❌ Item não encontrado no carrinho:', cartId);
        return;
    }

    const newQuantity = item.quantity + change;
    
    // Verificar se a quantidade é válida
    if (newQuantity < 1) {
        removeFromCart(cartId);
        return;
    }

    // Verificar estoque
    const product = STATE.products.find(p => p.id === item.id);
    if (product && newQuantity > product.stock) {
        console.log('📦 Estoque insuficiente:', product.name, 'Solicitado:', newQuantity, 'Disponível:', product.stock);
        showMessage('Quantidade máxima em estoque atingida.', 'warning');
        return;
    }

    item.quantity = newQuantity;
    console.log('✅ Quantidade atualizada:', item.name, 'Nova quantidade:', newQuantity);
    updateCartUI();
    cacheData('shoppingCart', STATE.cart);
}

function updateCartUI() {
    console.log('🔄 Atualizando interface do carrinho');
    updateCartItems();
    updateCartSummary();
    updateCartCount();
    updateCheckoutButton();
}

function updateCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) {
        console.error('❌ Container do carrinho não encontrado');
        return;
    }

    if (STATE.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag"></i>
                <h4>Seu carrinho está vazio</h4>
                <p>Adicione alguns produtos incríveis!</p>
            </div>
        `;
        console.log('🛒 Carrinho vazio');
        return;
    }

    container.innerHTML = STATE.cart.map(item => {
        const product = STATE.products.find(p => p.id === item.id);
        const maxStock = product ? product.stock : item.stock;
        
        return `
            <div class="cart-item">
                <img src="${item.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}" 
                     alt="${item.name}" 
                     class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Não+Encontrada'">
                
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">R$ ${formatPrice(item.price)}</div>
                    
                    <div class="cart-item-actions">
                        <button class="quantity-btn" onclick="updateCartItemQuantity('${item.cartId}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        
                        <input type="number" 
                               class="quantity-input" 
                               value="${item.quantity}" 
                               min="1" 
                               max="${maxStock}"
                               onchange="setCartItemQuantity('${item.cartId}', this.value)">
                        
                        <button class="quantity-btn" onclick="updateCartItemQuantity('${item.cartId}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        
                        <button class="remove-btn" onclick="removeFromCart('${item.cartId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ Itens do carrinho atualizados:', STATE.cart.length, 'itens');
}

function setCartItemQuantity(cartId, quantity) {
    console.log('🎯 Definindo quantidade específica:', cartId, 'Quantidade:', quantity);
    
    const parsedQuantity = parseInt(quantity);
    
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        console.log('❌ Quantidade inválida:', quantity);
        updateCartUI();
        return;
    }

    const item = STATE.cart.find(item => item.cartId === cartId);
    if (!item) {
        console.error('❌ Item não encontrado:', cartId);
        return;
    }

    const product = STATE.products.find(p => p.id === item.id);
    if (product && parsedQuantity > product.stock) {
        console.log('📦 Estoque insuficiente:', product.name, 'Solicitado:', parsedQuantity, 'Disponível:', product.stock);
        showMessage('Quantidade máxima em estoque atingida.', 'warning');
        updateCartUI();
        return;
    }

    item.quantity = parsedQuantity;
    console.log('✅ Quantidade definida:', item.name, 'Quantidade:', parsedQuantity);
    updateCartUI();
    cacheData('shoppingCart', STATE.cart);
}

function updateCartSummary() {
    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = STATE.storeConfig.deliveryFee || 2.00;
    const total = subtotal + deliveryFee;

    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');
    const deliveryEl = document.getElementById('cartDeliveryFee');

    if (subtotalEl) subtotalEl.textContent = `R$ ${formatPrice(subtotal)}`;
    if (totalEl) totalEl.textContent = `R$ ${formatPrice(total)}`;
    if (deliveryEl) deliveryEl.textContent = `R$ ${formatPrice(deliveryFee)}`;

    console.log('💰 Resumo do carrinho atualizado - Subtotal:', subtotal, 'Total:', total);
}

function updateCartCount() {
    const count = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    
    if (countElement) {
        countElement.textContent = count;
        countElement.style.display = count > 0 ? 'block' : 'none';
        console.log('🔢 Contador do carrinho:', count, 'itens');
    }
}

function updateCheckoutButton() {
    const button = document.getElementById('finalizarButton');
    if (button) {
        button.disabled = STATE.cart.length === 0;
        console.log('🛒 Botão finalizar compra:', button.disabled ? 'desabilitado' : 'habilitado');
    }
}

function clearCart() {
    console.log('🧹 Limpando carrinho');
    STATE.cart = [];
    updateCartUI();
    localStorage.removeItem('shoppingCart');
    showMessage('Carrinho limpo!', 'info');
}

// ===== SISTEMA DE PESQUISA EM TEMPO REAL =====
let searchTimeout = null;

function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    
    // Limpar timeout anterior
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Se campo vazio, esconder resultados
    if (searchTerm.length === 0) {
        closeSearchResults();
        return;
    }
    
    // Mostrar loading
    showSearchLoading();
    
    // Debounce - esperar usuário parar de digitar
    searchTimeout = setTimeout(() => {
        performSearch(searchTerm);
    }, 300);
}

function performSearch(searchTerm) {
    console.log('🔍 Realizando pesquisa:', searchTerm);
    
    const filteredProducts = STATE.products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm);
        const descriptionMatch = product.description && product.description.toLowerCase().includes(searchTerm);
        const categoryMatch = getCategoryName(product.categoryId).toLowerCase().includes(searchTerm);
        
        return nameMatch || descriptionMatch || categoryMatch;
    });
    
    displaySearchResults(filteredProducts, searchTerm);
}

function displaySearchResults(products, searchTerm) {
    const searchResults = document.getElementById('searchResults');
    const searchResultsContent = document.getElementById('searchResultsContent');
    
    if (!searchResults || !searchResultsContent) return;
    
    // Mostrar container de resultados
    searchResults.style.display = 'block';
    
    if (products.length === 0) {
        searchResultsContent.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <h4>Nenhum produto encontrado</h4>
                <p>Nenhum resultado para "<strong>${searchTerm}</strong>"</p>
                <p style="font-size: 0.875rem; margin-top: 10px; color: var(--gray-500);">
                    Tente outros termos de busca ou verifique a ortografia.
                </p>
            </div>
        `;
        return;
    }
    
    searchResultsContent.innerHTML = `
        <div class="search-results-stats" style="margin-bottom: 15px; font-size: 0.875rem; color: var(--gray-600);">
            ${products.length} produto(s) encontrado(s) para "<strong>${searchTerm}</strong>"
        </div>
        <div class="search-results-grid">
            ${products.map(product => {
                const category = STATE.categories.find(cat => cat.id === product.categoryId);
                const isOutOfStock = product.stock <= 0;
                
                return `
                    <div class="search-result-card" onclick="openProductFromSearch('${product.id}')">
                        <img src="${product.imageURL || 'https://via.placeholder.com/200x120?text=Produto'}" 
                             alt="${product.name}" 
                             class="search-result-image"
                             onerror="this.src='https://via.placeholder.com/200x120?text=Imagem+Não+Encontrada'">
                        
                        <div class="search-result-info">
                            <div class="search-result-name">${product.name}</div>
                            <div class="search-result-price">R$ ${formatPrice(product.price)}</div>
                            <div class="search-result-category">${category?.name || 'Geral'}</div>
                            
                            ${isOutOfStock ? 
                                '<div style="color: var(--error); font-size: 0.75rem; margin-top: 5px;">Esgotado</div>' : 
                                `<div style="color: var(--success); font-size: 0.75rem; margin-top: 5px;">
                                    ${product.stock} em estoque
                                </div>`
                            }
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--gray-200);">
            <button class="btn-secondary" onclick="showAllSearchResults('${searchTerm}')" style="font-size: 0.875rem;">
                <i class="fas fa-external-link-alt"></i> Ver todos os resultados
            </button>
        </div>
    `;
}

function showSearchLoading() {
    const searchResults = document.getElementById('searchResults');
    const searchResultsContent = document.getElementById('searchResultsContent');
    
    if (!searchResults || !searchResultsContent) return;
    
    searchResults.style.display = 'block';
    searchResultsContent.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <p>Buscando produtos...</p>
        </div>
    `;
}

function closeSearchResults() {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    if (searchResults) {
        searchResults.style.display = 'none';
    }
    
    if (searchInput) {
        searchInput.value = '';
    }
}

function openProductFromSearch(productId) {
    console.log('🎯 Abrindo produto da pesquisa:', productId);
    closeSearchResults();
    showProductDetails(productId);
}

function showAllSearchResults(searchTerm) {
    console.log('📋 Mostrando todos os resultados para:', searchTerm);
    closeSearchResults();
    
    // Filtrar produtos novamente (para garantir)
    const filteredProducts = STATE.products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm);
        const descriptionMatch = product.description && product.description.toLowerCase().includes(searchTerm);
        const categoryMatch = getCategoryName(product.categoryId).toLowerCase().includes(searchTerm);
        
        return nameMatch || descriptionMatch || categoryMatch;
    });
    
    // Mostrar na seção principal
    displaySearchResultsInMain(filteredProducts, searchTerm);
}

function displaySearchResultsInMain(products, searchTerm) {
    const container = document.getElementById('selectedCategoryProducts');
    const title = document.getElementById('categoryTitle');
    
    if (!container) return;
    
    if (title) {
        title.textContent = `Resultados para: "${searchTerm}"`;
    }
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Nenhum resultado para "<strong>${searchTerm}</strong>"</p>
                <button class="btn-primary" onclick="clearSearch()" style="margin-top: 15px;">
                    <i class="fas fa-times"></i> Limpar Pesquisa
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="search-results-header" style="margin-bottom: 20px;">
            <div>
                <h3>Resultados para: "${searchTerm}"</h3>
                <p style="color: var(--gray-600); margin: 0;">${products.length} produto(s) encontrado(s)</p>
            </div>
            <button class="btn-secondary" onclick="clearSearch()">
                <i class="fas fa-times"></i> Limpar
            </button>
        </div>
        <div class="products-grid">
            ${products.map(product => {
                const category = STATE.categories.find(cat => cat.id === product.categoryId);
                const isOutOfStock = product.stock <= 0;
                
                return `
                    <div class="product-card" data-product-id="${product.id}">
                        <img src="${product.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}" 
                             alt="${product.name}" 
                             class="product-image"
                             onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Não+Encontrada'"
                             onclick="showProductDetails('${product.id}')">
                        
                        <div class="product-info">
                            <h3 class="product-title">${product.name}</h3>
                            <div class="product-price">R$ ${formatPrice(product.price)}</div>
                            
                            <div class="product-meta">
                                <span class="product-category">${category?.name || 'Geral'}</span>
                                <span class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                                    ${isOutOfStock ? 'Esgotado' : `${product.stock} em estoque`}
                                </span>
                            </div>
                            
                            <div class="product-actions">
                                <button class="btn-secondary" onclick="showProductDetails('${product.id}')">
                                    <i class="fas fa-eye"></i> Detalhes
                                </button>
                                <button class="btn-primary" onclick="addToCart('${product.id}')" 
                                        ${isOutOfStock ? 'disabled' : ''}>
                                    <i class="fas fa-shopping-bag"></i> 
                                    ${isOutOfStock ? 'Esgotado' : 'Comprar'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const title = document.getElementById('categoryTitle');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (title) {
        title.textContent = 'Todos os Produtos';
    }
    
    // Recarregar produtos da categoria atual
    if (STATE.currentCategory) {
        loadProducts(STATE.currentCategory);
    } else {
        displayProducts();
    }
}

// Fechar resultados ao clicar fora
document.addEventListener('click', function(event) {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    if (searchResults && searchInput && 
        !searchResults.contains(event.target) && 
        !searchInput.contains(event.target)) {
        closeSearchResults();
    }
});

// Tecla ESC fecha resultados
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSearchResults();
    }
});


function getCategoryName(categoryId) {
    const category = STATE.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Geral';
}


document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("queroLuxoTheme");
  if (!saved) return;

  const { bg1, bg2, radial1, radial2, exStart, exEnd } = JSON.parse(saved);

  // Aplica o fundo madrepérola
  document.body.style.background = `
    linear-gradient(135deg, ${bg1}, ${bg2}),
    radial-gradient(circle at top left, ${radial1}, transparent 70%),
    radial-gradient(circle at bottom right, ${radial2}, transparent 70%)
  `;
  document.body.style.backgroundBlendMode = "screen, overlay";
  document.body.style.backgroundAttachment = "fixed";

  // Aplica o gradiente dos produtos exclusivos
  const exclusiveSection = document.querySelector(".exclusive-products");
  if (exclusiveSection) {
    exclusiveSection.style.background = `linear-gradient(135deg, ${exStart} 0%, ${exEnd} 100%)`;
  }
});



// ===== APLICAR CONFIGURAÇÕES DO BANNER NO SITE PRINCIPAL =====

async function applyStoreConfig() {
    try {
        const doc = await db.collection('config').doc('store').get();
        if (doc.exists) {
            const config = doc.data();
            
            // Aplicar logo
            const profileImage = document.getElementById('profileImage');
            if (profileImage && config.logoUrl) {
                profileImage.src = config.logoUrl;
                profileImage.onerror = function() {
                    this.src = 'https://via.placeholder.com/150x50/1a1a1a/ffffff?text=TNT+STORE';
                };
            }
            
            // Aplicar nome da loja
            const profileName = document.getElementById('profileName');
            if (profileName && config.name) {
                profileName.textContent = config.name;
            }
            
           // Aplicar background do header mantendo os efeitos
const headerMain = document.querySelector('.header-main');
if (headerMain && config.headerBackgroundUrl) {
    // Cria um elemento interno para a imagem
    const bgContainer = document.createElement('div');
    bgContainer.className = 'header-bg-container';
    bgContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        background: 
            linear-gradient(135deg, rgba(15, 15, 15, 0.7) 0%, rgba(35, 35, 35, 0.6) 100%),
            url('${config.headerBackgroundUrl}') center/cover no-repeat;
    `;
    
    // Limpa o header e adiciona o novo container
    headerMain.style.background = 'none';
    headerMain.style.position = 'relative';
    headerMain.insertBefore(bgContainer, headerMain.firstChild);
    
    // Garante que os efeitos de brilho fiquem acima
    const sparkleLayer = document.createElement('div');
    sparkleLayer.className = 'header-sparkle-layer';
    sparkleLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
        background: 
            radial-gradient(circle at 25% 35%, rgba(255, 255, 255, 0.12) 0%, transparent 100px),
            radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.1) 0%, transparent 120px),
            radial-gradient(circle at 45% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 90px);
        mix-blend-mode: overlay;
        animation: pulseGlow 8s infinite alternate;
    `;
    
    headerMain.appendChild(sparkleLayer);
    
    // Adiciona a animação
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes pulseGlow {
            0% { opacity: 0.6; }
            100% { opacity: 0.9; }
        }
        
        /* Garante que o conteúdo fique acima de tudo */
        .header-main > *:not(.header-bg-container):not(.header-sparkle-layer) {
            position: relative;
            z-index: 2;
        }
    `;
    document.head.appendChild(style);
}
        }
    } catch (error) {
        console.error('Erro ao aplicar configurações:', error);
    }
}

// Aplicar configurações quando a página carregar
document.addEventListener('DOMContentLoaded', applyStoreConfig);

// Opcional: Escutar mudanças em tempo real
function setupConfigListener() {
    db.collection('config').doc('store')
        .onSnapshot((doc) => {
            if (doc.exists) {
                applyStoreConfig();
            }
        });
}

// Iniciar listener (opcional)
// setupConfigListener();

// ===== APLICAR CORES PERSONALIZADAS NO SITE PRINCIPAL =====

// Função para aplicar as cores
function applyCustomColors(colors) {
    console.log('🎨 Aplicando cores personalizadas:', colors);
    
    // Remover estilo anterior se existir
    const existingStyle = document.getElementById('custom-colors');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Criar novo estilo
    const style = document.createElement('style');
    style.id = 'custom-colors';
    
    // Gerar CSS com as cores personalizadas
    style.textContent = `
        /* Top Bar */
        .top-bar {
            background: linear-gradient(${colors.topBarDirection}, ${colors.topBarColor1} 0%, ${colors.topBarColor2} 100%) !important;
            border-bottom: 1px solid ${hexToRgba(colors.borderColor, colors.borderOpacity / 100)} !important;
        }
        
        /* Variáveis CSS */
        :root {
            --primary: ${colors.primaryColor} !important;
            --secondary: ${colors.secondaryColor} !important;
            --primary-dark: ${darkenColor(colors.primaryColor, 10)} !important;
        }
        
        /* Elementos com cor primária */
        .promo-tag {
            background: linear-gradient(135deg, ${colors.primaryColor}, ${lightenColor(colors.primaryColor, 20)}) !important;
            color: ${getContrastColor(colors.primaryColor)} !important;
        }
        
        .cart-btn:hover, 
        .admin-btn:hover {
            background: ${hexToRgba(colors.primaryColor, 0.15)} !important;
            border-color: ${colors.primaryColor} !important;
            
            
        }
        
        .cart-count {
            background: ${colors.primaryColor} !important;
            color: ${getContrastColor(colors.primaryColor)} !important;
        }
        
        /* Botões admin */
        .admin-btn {
            border-color: ${colors.primaryColor} !important;
            color: ${colors.primaryColor} !important;
        }
        
        .admin-btn:hover {
            background: ${colors.primaryColor} !important;
            color: ${getContrastColor(colors.primaryColor)} !important;
        }
        
        /* Efeitos de brilho */
        .top-bar::before {
            background: linear-gradient(90deg, transparent, ${colors.primaryColor}, transparent) !important;
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Cores aplicadas com sucesso!');
}

// Função para carregar e aplicar cores
async function loadAndApplyColors() {
    try {
        console.log('🔄 Carregando cores do Firestore...');
        
        const doc = await db.collection('config').doc('colors').get();
        
        if (doc.exists) {
            const colors = doc.data();
            console.log('🎨 Cores encontradas:', colors);
            applyCustomColors(colors);
        } else {
            console.log('ℹ️  Nenhuma cor personalizada encontrada, usando padrão');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar cores:', error);
    }
}

// Funções utilitárias para cores
function hexToRgba(hex, opacity) {
    if (!hex) return `rgba(255, 215, 0, ${opacity})`;
    
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function lightenColor(hex, percent) {
    if (!hex) return '#ffed4e';
    
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.min(255, r + (255 - r) * (percent / 100));
    const newG = Math.min(255, g + (255 - g) * (percent / 100));
    const newB = Math.min(255, b + (255 - b) * (percent / 100));
    
    return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
}

function darkenColor(hex, percent) {
    if (!hex) return '#e6c200';
    
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.max(0, r * (1 - percent / 100));
    const newG = Math.max(0, g * (1 - percent / 100));
    const newB = Math.max(0, b * (1 - percent / 100));
    
    return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
}

function getContrastColor(hex) {
    if (!hex) return '#000000';
    
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Fórmula de luminância
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Escutar mudanças em tempo real (opcional)
function setupColorListener() {
    console.log('👂 Iniciando listener de cores...');
    
    db.collection('config').doc('colors')
        .onSnapshot((doc) => {
            if (doc.exists) {
                console.log('🔄 Cores atualizadas em tempo real!');
                const colors = doc.data();
                applyCustomColors(colors);
            }
        }, (error) => {
            console.error('❌ Erro no listener de cores:', error);
        });
}
// Inicialização separada no site principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página carregada, aplicando cores...');
    
    setTimeout(() => {
        // Aplicar cores do HEADER
        loadAndApplyColors();
            loadAndApplyBannerSettings();

        // Aplicar cores da NAVEGAÇÃO (separado)
        loadAndApplyNavigationColors();
        
        // Opcional: Ativar listeners em tempo real
        // setupColorListener();
        // setupNavigationColorListener();
    }, 1000);
});

// Funções separadas para teste
window.reloadHeaderColors = loadAndApplyColors;
window.reloadNavigationColors = loadAndApplyNavigationColors;

// Forçar recarregamento de cores (para teste)
window.reloadColors = loadAndApplyColors;

// DEBUG - Verificar se as cores estão sendo carregadas
async function debugColorLoad() {
    try {
        console.log('🎨 Iniciando carregamento de cores...');
        const doc = await db.collection('config').doc('colors').get();
        console.log('📦 Documento de cores:', doc.exists ? 'EXISTE' : 'NÃO EXISTE');
        if (doc.exists) {
            const colors = doc.data();
            console.log('🌈 Cores carregadas:', colors);
            return colors;
        } else {
            console.log('❌ Nenhuma configuração de cores encontrada');
            return null;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar cores:', error);
        return null;
    }
}


// ===== APLICAR CORES DA NAVEGAÇÃO NO SITE PRINCIPAL =====

// Função para aplicar as cores da navegação
function applyNavigationColors(navColors) {
    console.log('🎨 Aplicando cores da navegação:', navColors);
    
    // Remover estilo anterior se existir
    const existingStyle = document.getElementById('custom-navigation-colors');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Criar novo estilo
    const style = document.createElement('style');
    style.id = 'custom-navigation-colors';
    
    // Gerar CSS com as cores da navegação
    style.textContent = `
        /* Category Nav */
        .category-nav {
            background: linear-gradient(${navColors.categoryNavDirection || '135deg'}, ${navColors.categoryNavColor1 || '#d33434'} 0%, ${navColors.categoryNavColor2 || '#2d2d2d'} 100%) !important;
            border-bottom: 1px solid ${hexToRgba(navColors.categoryNavBorderColor || '#ffd700', (navColors.categoryNavBorderOpacity || 30) / 100)} !important;
        }
        
        /* Botões da Category Nav */
        .category-btn {
            background: ${navColors.categoryBtnBgColor || 'rgba(255,255,255,0.1)'} !important;
            color: ${navColors.categoryBtnTextColor || '#e0e0e0'} !important;
            border: 1px solid ${navColors.categoryBtnBorderColor || 'rgba(255, 255, 255, 0.1)'} !important;
        }
        
        .category-btn:hover {
            background: ${navColors.categoryBtnHoverColor || 'rgba(255,215,0,0.15)'} !important;
            color: #ffffff !important;
            border-color: ${hexToRgba(navColors.categoryBtnActiveColor || '#ffd700', 0.3)} !important;
        }
        
        .category-btn.active {
            background: ${navColors.categoryBtnActiveColor || '#ffd700'} !important;
            color: ${getContrastColor(navColors.categoryBtnActiveColor || '#ffd700')} !important;
            border-color: ${navColors.categoryBtnActiveColor || '#ffd700'} !important;
        }
        
        /* Subcategory Nav */
        .subcategory-nav {
            background: linear-gradient(${navColors.categoryNavDirection || '135deg'}, ${darkenColor(navColors.categoryNavColor1 || '#d33434', 10)} 0%, ${darkenColor(navColors.categoryNavColor2 || '#2d2d2d', 10)} 100%) !important;
            border-bottom: 1px solid ${hexToRgba(navColors.categoryNavBorderColor || '#ffd700', (navColors.categoryNavBorderOpacity || 30) / 200)} !important;
        }
        
        .subcategory-btn {
            background: ${darkenColor(navColors.categoryBtnBgColor || 'rgba(255,255,255,0.1)', 20)} !important;
            color: ${navColors.categoryBtnTextColor || '#e0e0e0'} !important;
            border: 1px solid ${darkenColor(navColors.categoryBtnBorderColor || 'rgba(255,255,255,0.1)', 20)} !important;
        }
        
        .subcategory-btn:hover {
            background: ${navColors.categoryBtnHoverColor || 'rgba(255,215,0,0.15)'} !important;
            color: #ffffff !important;
        }
        
        .subcategory-btn.active {
            background: ${hexToRgba(navColors.categoryBtnActiveColor || '#ffd700', 0.15)} !important;
            color: ${navColors.categoryBtnActiveColor || '#ffd700'} !important;
            border-color: ${hexToRgba(navColors.categoryBtnActiveColor || '#ffd700', 0.4)} !important;
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Cores da navegação aplicadas com sucesso!');
}

// Função para carregar e aplicar cores da navegação
async function loadAndApplyNavigationColors() {
    try {
        console.log('🔄 Carregando cores da navegação...');
        
        const doc = await db.collection('config').doc('navigation').get();
        
        if (doc.exists) {
            const navColors = doc.data();
            console.log('🎨 Cores da navegação encontradas:', navColors);
            applyNavigationColors(navColors);
        } else {
            console.log('ℹ️  Nenhuma cor de navegação personalizada encontrada, usando padrão');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar cores da navegação:', error);
    }
}

// Escutar mudanças em tempo real na navegação
function setupNavigationColorListener() {
    console.log('👂 Iniciando listener de cores da navegação...');
    
    db.collection('config').doc('navigation')
        .onSnapshot((doc) => {
            if (doc.exists) {
                console.log('🔄 Cores da navegação atualizadas em tempo real!');
                const navColors = doc.data();
                applyNavigationColors(navColors);
            }
        }, (error) => {
            console.error('❌ Erro no listener de cores da navegação:', error);
        });
}

// ===== APLICAR CONFIGURAÇÕES DO BANNER NO SITE PRINCIPAL =====

// Função para aplicar as configurações do banner
function applyBannerSettings(bannerConfig) {
    console.log('🎨 Aplicando configurações do banner:', bannerConfig);
    
    // Remover estilo anterior se existir
    const existingStyle = document.getElementById('custom-banner-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Criar novo estilo
    const style = document.createElement('style');
    style.id = 'custom-banner-styles';
    
    // Gerar CSS com as configurações do banner
    style.textContent = `
        /* Banner Promocional */
        .promo-banner {
            background: linear-gradient(${bannerConfig.bannerBgDirection || '135deg'}, ${bannerConfig.bannerBgColor1 || '#0a0a0a'} 0%, ${bannerConfig.bannerBgColor2 || '#1a1a1a'} 100%) !important;
            border: 1px solid ${hexToRgba(bannerConfig.bannerBorderColor || '#ffd700', (bannerConfig.bannerBorderOpacity || 10) / 100)} !important;
            border-radius: ${bannerConfig.bannerBorderRadius || '30px'} !important;
            backdrop-filter: blur(10px) !important;
        }
        
        /* Tag Promocional */
        .promo-tag {
            background: ${bannerConfig.promoTagBgColor || '#ffd700'} !important;
            color: ${bannerConfig.promoTagTextColor || '#1a1a1a'} !important;
            font-size: ${bannerConfig.promoTagFontSize || '0.75rem'} !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
        }
        
        /* Texto Principal */
        .promo-text {
            color: ${bannerConfig.promoTextColor || '#e0e0e0'} !important;
            font-size: ${bannerConfig.promoTextFontSize || '0.875rem'} !important;
            font-weight: ${bannerConfig.promoTextFontWeight || '500'} !important;
        }
    `;
    
    document.head.appendChild(style);
    
    // Atualizar textos dinamicamente
    updateBannerTexts(bannerConfig);
    
    console.log('✅ Configurações do banner aplicadas com sucesso!');
}

// Atualizar textos do banner
function updateBannerTexts(bannerConfig) {
    const promoTag = document.querySelector('.promo-tag');
    const promoText = document.querySelector('.promo-text');
    
    if (promoTag && bannerConfig.promoTagText) {
        promoTag.textContent = bannerConfig.promoTagText;
    }
    
    if (promoText && bannerConfig.promoMainText) {
        promoText.textContent = bannerConfig.promoMainText;
    }
}

// Carregar e aplicar configurações do banner
async function loadAndApplyBannerSettings() {
    try {
        console.log('🔄 Carregando configurações do banner...');
        
        const doc = await db.collection('config').doc('banner').get();
        
        if (doc.exists) {
            const bannerConfig = doc.data();
            console.log('🎨 Configurações do banner encontradas:', bannerConfig);
            applyBannerSettings(bannerConfig);
        } else {
            console.log('ℹ️  Nenhuma configuração de banner personalizada encontrada, usando padrão');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar configurações do banner:', error);
    }
}

// Listener para mudanças em tempo real
function setupBannerListener() {
    db.collection('config').doc('banner')
        .onSnapshot((doc) => {
            if (doc.exists) {
                console.log('🔄 Banner atualizado em tempo real!');
                const bannerConfig = doc.data();
                applyBannerSettings(bannerConfig);
            }
        });
}



// Contador de Visitantes com Firebase - VERSÃO COMPLETA

// Função para detectar tipo de dispositivo
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "Tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "Mobile";
    }
    return "Desktop";
}

// Função para detectar navegador
function getBrowserName() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident") || ua.includes("MSIE")) browser = "Internet Explorer";
    else if (ua.includes("Edge")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    
    return browser;
}

// Função para detectar sistema operacional
function getOSName() {
    const ua = navigator.userAgent;
    let os = "Unknown";
    
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("X11")) os = "UNIX";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS") || ua.includes("like Mac")) os = "iOS";
    
    return os;
}

// Função de animação do contador
function animateCounter(element, finalNumber) {
    const currentNumber = parseInt(element.textContent.replace(/\D/g, '')) || 0;
    if (currentNumber >= finalNumber) return;
    
    let count = currentNumber;
    const increment = Math.ceil((finalNumber - currentNumber) / 50);
    
    const timer = setInterval(() => {
        count += increment;
        if (count >= finalNumber) {
            count = finalNumber;
            clearInterval(timer);
        }
        element.textContent = count.toLocaleString('pt-BR');
    }, 20);
}

// Função para mostrar notificação
function showVisitNotification(visitNumber) {
    if (visitNumber % 10 === 0) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(72, 187, 120, 0.3);
            z-index: 10000;
            animation: slideIn 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-trophy me-2"></i>
            <strong>🎉 ${visitNumber}º Visitante!</strong>
            <div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">
                Obrigado por fazer parte!
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in forwards';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// Fallback: Contador simples com localStorage
function initSimpleCounter() {
    const key = 'comerciante_total_visits';
    let visits = localStorage.getItem(key);
    visits = visits ? parseInt(visits) + 1 : 1;
    localStorage.setItem(key, visits);
    
    const counterElement = document.getElementById('counter') || document.querySelector('#visitor-counter span');
    if (counterElement) {
        counterElement.textContent = visits.toLocaleString('pt-BR');
        animateCounter(counterElement, visits);
    }
}

// Função alternativa para obter IP via WebRTC (último recurso)
function getIPFromWebRTC() {
    return new Promise((resolve) => {
        try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');
            pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
            
            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                const regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
                const match = regex.exec(ice.candidate.candidate);
                if (match) {
                    resolve(match[1]);
                }
                pc.close();
            };
            
            setTimeout(() => {
                pc.close();
                resolve(null);
            }, 1000);
        } catch (error) {
            resolve(null);
        }
    });
}

// ATUALIZADO: Função melhorada para coletar dados do visitante
async function collectVisitorData() {
    const data = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        deviceType: getDeviceType(),
        browser: getBrowserName(),
        os: getOSName(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        referrer: document.referrer || 'Direct',
        pageUrl: window.location.href,
        pageTitle: document.title,
        sessionStart: new Date().toISOString(),
        // Novos campos adicionados
        ip: null,
        city: null,
        region: null,
        country: null,
        countryCode: null,
        postalCode: null,
        latitude: null,
        longitude: null,
        currency: null,
        org: null,
        asn: null
    };

    try {
        // TENTATIVA 1: Usar ipapi.co (mais confiável para localização)
        const ipapiResponse = await fetch('https://ipapi.co/json/', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => response.json())
          .catch(() => null);

        if (ipapiResponse && ipapiResponse.ip) {
            console.log('Dados do ipapi.co:', ipapiResponse);
            data.ip = ipapiResponse.ip;
            data.city = ipapiResponse.city;
            data.region = ipapiResponse.region;
            data.country = ipapiResponse.country_name;
            data.countryCode = ipapiResponse.country_code;
            data.postalCode = ipapiResponse.postal;
            data.latitude = ipapiResponse.latitude;
            data.longitude = ipapiResponse.longitude;
            data.currency = ipapiResponse.currency;
            data.org = ipapiResponse.org || ipapiResponse.asn;
            data.timezone = ipapiResponse.timezone;
            data.asn = ipapiResponse.asn;
        }
        
        // Se ipapi.co falhou, tentar ipify para apenas IP
        if (!data.ip) {
            const ipifyResponse = await fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .catch(() => null);
                
            if (ipifyResponse && ipifyResponse.ip) {
                data.ip = ipifyResponse.ip;
                
                // Com o IP, tentar outra API para geolocalização
                // Note: ipinfo.io precisa de token, então comentei
                /*
                const geoResponse = await fetch(`https://ipinfo.io/${data.ip}/json?token=SEU_TOKEN`)
                    .then(response => response.json())
                    .catch(() => null);
                    
                if (geoResponse) {
                    data.city = geoResponse.city;
                    data.region = geoResponse.region;
                    data.country = geoResponse.country;
                    data.postalCode = geoResponse.postal;
                    data.org = geoResponse.org;
                    const loc = geoResponse.loc ? geoResponse.loc.split(',') : null;
                    if (loc) {
                        data.latitude = loc[0];
                        data.longitude = loc[1];
                    }
                }
                */
            }
        }
        
        // Fallback: Usar API pública gratuita (ip-api.com) - HTTP apenas
        if (!data.ip) {
            const ipApiResponse = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query')
                .then(response => response.json())
                .catch(() => null);
                
            if (ipApiResponse && ipApiResponse.status === 'success') {
                data.ip = ipApiResponse.query;
                data.city = ipApiResponse.city;
                data.region = ipApiResponse.regionName;
                data.country = ipApiResponse.country;
                data.countryCode = ipApiResponse.countryCode;
                data.postalCode = ipApiResponse.zip;
                data.latitude = ipApiResponse.lat;
                data.longitude = ipApiResponse.lon;
                data.timezone = ipApiResponse.timezone;
                data.org = ipApiResponse.isp || ipApiResponse.org;
                data.asn = ipApiResponse.as;
            }
        }

        // Se ainda não tem IP, usar WebRTC como último recurso (pode ser bloqueado)
        if (!data.ip) {
            const webrtcIP = await getIPFromWebRTC();
            if (webrtcIP) data.ip = webrtcIP;
        }

    } catch (error) {
        console.log('Erro ao coletar dados de IP:', error);
        // Não interrompe o fluxo se falhar
    }

    return data;
}

// ATUALIZADO: Função para salvar detalhes do visitante
async function saveVisitorDetails(deviceId, visitorData) {
    try {
        const visitorRef = db.collection('visitors_detail').doc(deviceId);
        
        const existingDoc = await visitorRef.get();
        const existingData = existingDoc.exists ? existingDoc.data() : {};
        
        const visitorDoc = {
            ...existingData,
            ...visitorData,
            deviceId: deviceId,
            lastVisit: firebase.firestore.FieldValue.serverTimestamp(),
            visitCount: firebase.firestore.FieldValue.increment(1),
            pagesVisited: firebase.firestore.FieldValue.arrayUnion(visitorData.pageUrl)
        };

        // Se for primeira visita, adicionar timestamp
        if (!existingDoc.exists) {
            visitorDoc.firstVisit = firebase.firestore.FieldValue.serverTimestamp();
            visitorDoc.pagesVisited = [visitorData.pageUrl];
            visitorDoc.visitCount = 1;
        }

        await visitorRef.set(visitorDoc);

        console.log('Dados do visitante salvos:', {
            ip: visitorData.ip,
            cidade: visitorData.city,
            região: visitorData.region,
            país: visitorData.country,
            provedor: visitorData.org
        });

    } catch (error) {
        console.error('Erro ao salvar detalhes do visitante:', error);
    }
}

// Nova função para atualizar último acesso
async function updateLastAccess(deviceId) {
    try {
        const visitorRef = db.collection('visitors_detail').doc(deviceId);
        await visitorRef.update({
            lastAccess: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Erro ao atualizar último acesso:', error);
    }
}

// Função para gerar CSV
async function generateCSV(visitors) {
    const headers = ['IP', 'Cidade', 'Região', 'País', 'CEP', 'Dispositivo', 'Navegador', 'OS', 'Provedor', 'Primeira Visita', 'Última Visita', 'Total Visitas'];
    
    const rows = visitors.map(v => [
        v.ip || '',
        v.city || '',
        v.region || '',
        v.country || '',
        v.postalCode || '',
        v.deviceType || '',
        v.browser || '',
        v.os || '',
        v.org || '',
        v.formattedFirstVisit || '',
        v.formattedLastVisit || '',
        v.visitCount || 1
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// Função para baixar CSV
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Contador de Visitantes com Firebase - VERSÃO CORRIGIDA
async function initFirebaseVisitorCounter() {
    try {
        // Verificar se Firebase está disponível
        if (typeof firebase === 'undefined' || typeof db === 'undefined') {
            console.log('Firebase não disponível, usando localStorage');
            return initSimpleCounter();
        }

        // Elemento para mostrar o contador
        let counterElement = document.getElementById('counter');
        if (!counterElement) {
            // Criar elemento se não existir
            const counterDiv = document.createElement('div');
            counterDiv.id = 'visitor-counter';
            counterDiv.innerHTML = `
                <i class="fas fa-users me-1"></i>
                <span id="counter">0</span> visitantes
            `;
            counterDiv.style.cssText = `
                position: fixed; 
                bottom: 10px; 
                right: 10px; 
                background: linear-gradient(135deg, #667eea, #764ba2); 
                color: white; 
                padding: 8px 15px; 
                border-radius: 20px; 
                font-size: 12px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
                z-index: 9999;
                cursor: pointer;
            `;
            document.body.appendChild(counterDiv);
            counterElement = document.getElementById('counter');
        }

        // ID único para este dispositivo (persistente)
        let deviceId = localStorage.getItem('comerciante_device_id');
        let visitorData = {};
        
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('comerciante_device_id', deviceId);
            
            // Coletar dados do visitante apenas na primeira visita
            visitorData = await collectVisitorData();
            localStorage.setItem('comerciante_visitor_data', JSON.stringify(visitorData));
        } else {
            // Recuperar dados existentes
            const savedData = localStorage.getItem('comerciante_visitor_data');
            if (savedData) {
                visitorData = JSON.parse(savedData);
            } else {
                // Se não tem dados salvos, coletar novamente
                visitorData = await collectVisitorData();
                localStorage.setItem('comerciante_visitor_data', JSON.stringify(visitorData));
            }
        }

        // Verificar se este dispositivo já foi contado hoje
        const today = new Date().toISOString().split('T')[0];
        const lastCountedDate = localStorage.getItem('last_counted_date');
        
        // Referência do Firebase
        const statsRef = db.collection('site_stats').doc('visitors');
        const visitorsDetailRef = db.collection('visitors_detail');
        
        // Buscar dados atuais
        const doc = await statsRef.get();
        let currentStats = { 
            total: 0, 
            today: 0, 
            devices: [], 
            updatedAt: null,
            countries: {},
            browsers: {},
            devicesType: {},
            referrers: {},
            cities: {}, // Nova propriedade para cidades
            regions: {}, // Nova propriedade para regiões
            isps: {} // Nova propriedade para provedores
        };

        if (doc.exists) {
            currentStats = doc.data();
            // Mostrar contador atual imediatamente
            counterElement.textContent = currentStats.total.toLocaleString('pt-BR');
        }

        // Se este dispositivo ainda não foi contado hoje, incrementar
        if (lastCountedDate !== today) {
            try {
                // Preparar dados para atualização
                const updateData = {
                    total: firebase.firestore.FieldValue.increment(1),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Incrementar contador de hoje
                if (currentStats.lastResetDate !== today) {
                    updateData.today = 1;
                    updateData.lastResetDate = today;
                    updateData.devices = [deviceId]; // Resetar array de dispositivos do dia
                    
                    // Resetar estatísticas do dia
                    updateData.todayCountries = {};
                    updateData.todayDevices = {};
                    updateData.todayBrowsers = {};
                    updateData.todayCities = {};
                    updateData.todayRegions = {};
                    
                } else {
                    updateData.today = firebase.firestore.FieldValue.increment(1);
                    
                    // Adicionar dispositivo ao array se não existir
                    if (!currentStats.devices || !currentStats.devices.includes(deviceId)) {
                        updateData.devices = firebase.firestore.FieldValue.arrayUnion(deviceId);
                    }
                }

                // ATUALIZAÇÃO: Agora salvamos cidade, região e provedor também
                if (visitorData.country) {
                    updateData[`countries.${visitorData.country}`] = firebase.firestore.FieldValue.increment(1);
                    updateData[`todayCountries.${visitorData.country}`] = firebase.firestore.FieldValue.increment(1);
                }
                
                if (visitorData.city && visitorData.country) {
                    const cityKey = `${visitorData.city}, ${visitorData.country}`;
                    updateData[`cities.${cityKey}`] = firebase.firestore.FieldValue.increment(1);
                    updateData[`todayCities.${cityKey}`] = firebase.firestore.FieldValue.increment(1);
                }
                
                if (visitorData.region && visitorData.country) {
                    const regionKey = `${visitorData.region}, ${visitorData.country}`;
                    updateData[`regions.${regionKey}`] = firebase.firestore.FieldValue.increment(1);
                    updateData[`todayRegions.${regionKey}`] = firebase.firestore.FieldValue.increment(1);
                }
                
                if (visitorData.org) {
                    updateData[`isps.${visitorData.org}`] = firebase.firestore.FieldValue.increment(1);
                }
                
                if (visitorData.browser) {
                    updateData[`browsers.${visitorData.browser}`] = firebase.firestore.FieldValue.increment(1);
                    updateData[`todayBrowsers.${visitorData.browser}`] = firebase.firestore.FieldValue.increment(1);
                }
                
                if (visitorData.deviceType) {
                    updateData[`devicesType.${visitorData.deviceType}`] = firebase.firestore.FieldValue.increment(1);
                    updateData[`todayDevices.${visitorData.deviceType}`] = firebase.firestore.FieldValue.increment(1);
                }
                
                if (visitorData.referrer) {
                    const refKey = visitorData.referrer.length > 50 
                        ? visitorData.referrer.substring(0, 50) + '...' 
                        : visitorData.referrer;
                    updateData[`referrers.${refKey}`] = firebase.firestore.FieldValue.increment(1);
                }

                // Salvar no Firebase
                await statsRef.set(updateData, { merge: true });

                // Salvar detalhes do visitante em coleção separada COM IP
                await saveVisitorDetails(deviceId, visitorData);

                // Atualizar localStorage
                localStorage.setItem('last_counted_date', today);

                // Buscar dados atualizados
                const updatedDoc = await statsRef.get();
                if (updatedDoc.exists) {
                    const newStats = updatedDoc.data();
                    counterElement.textContent = newStats.total.toLocaleString('pt-BR');
                    
                    // Animar contador
                    animateCounter(counterElement, newStats.total);
                    
                    // Mostrar notificação para novo visitante
                    if (!currentStats.devices || !currentStats.devices.includes(deviceId)) {
                        showVisitNotification(newStats.total);
                    }
                }

            } catch (error) {
                console.error('Erro ao atualizar contador:', error);
                // Fallback para localStorage
                initSimpleCounter();
            }
        } else {
            // Já foi contado hoje, apenas mostrar número
            counterElement.textContent = currentStats.total.toLocaleString('pt-BR');
            animateCounter(counterElement, currentStats.total);
            
            // Atualizar último acesso na coleção de detalhes
            if (deviceId) {
                await updateLastAccess(deviceId);
            }
        }

        // Adicionar clique para mostrar detalhes
        document.getElementById('visitor-counter').addEventListener('click', function() {
            showVisitorDetails(statsRef);
        });

    } catch (error) {
        console.error('Erro no contador:', error);
        initSimpleCounter();
    }
}

// ATUALIZADO: Função para mostrar detalhes dos visitantes
async function showVisitorDetails(statsRef) {
    try {
        const [statsDoc, visitorsSnapshot] = await Promise.all([
            statsRef.get(),
            db.collection('visitors_detail')
                .orderBy('lastVisit', 'desc')
                .limit(20)
                .get()
        ]);

        if (!statsDoc.exists) return;

        const stats = statsDoc.data();
        const recentVisitors = [];
        
        visitorsSnapshot.forEach(doc => {
            const data = doc.data();
            // Formatar dados para exibição
            data.formattedFirstVisit = data.firstVisit 
                ? new Date(data.firstVisit.seconds * 1000).toLocaleDateString('pt-BR')
                : 'N/A';
                
            data.formattedLastVisit = data.lastVisit 
                ? new Date(data.lastVisit.seconds * 1000).toLocaleString('pt-BR')
                : 'N/A';
                
            recentVisitors.push(data);
        });

        const detailsHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                     background: white; padding: 30px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                     z-index: 10000; min-width: 400px; max-width: 900px; max-height: 90vh; overflow-y: auto;">
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-chart-bar fa-2x mb-2" style="color: #667eea;"></i>
                    <h4 style="margin: 0; color: #2d3748;">Dashboard de Visitantes</h4>
                    <small style="color: #718096;">IP, Localização e Dispositivos</small>
                </div>
                
                <!-- Cards de Resumo -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px;">
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 15px; border-radius: 10px; text-align: center; color: white;">
                        <div style="font-size: 1.5em; font-weight: 800;">${stats.total || 0}</div>
                        <div style="font-size: 0.8em; opacity: 0.9;">Total</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #48bb78, #38a169); padding: 15px; border-radius: 10px; text-align: center; color: white;">
                        <div style="font-size: 1.5em; font-weight: 800;">${stats.today || 0}</div>
                        <div style="font-size: 0.8em; opacity: 0.9;">Hoje</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #ed8936, #dd6b20); padding: 15px; border-radius: 10px; text-align: center; color: white;">
                        <div style="font-size: 1.5em; font-weight: 800;">${stats.devices ? stats.devices.length : 0}</div>
                        <div style="font-size: 0.8em; opacity: 0.9;">Únicos Hoje</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #9f7aea, #805ad5); padding: 15px; border-radius: 10px; text-align: center; color: white;">
                        <div style="font-size: 1.5em; font-weight: 800;">${recentVisitors.length}</div>
                        <div style="font-size: 0.8em; opacity: 0.9;">Registros</div>
                    </div>
                </div>
                
                <!-- Tabs Melhoradas -->
                <div style="display: flex; border-bottom: 2px solid #e2e8f0; margin-bottom: 20px;">
                    <button class="tab-btn active" onclick="switchTab('visitors')" style="flex: 1; padding: 10px; border: none; background: none; cursor: pointer; font-weight: 600; color: #667eea;">
                        <i class="fas fa-user-friends me-2"></i>Visitantes
                    </button>
                    <button class="tab-btn" onclick="switchTab('locations')" style="flex: 1; padding: 10px; border: none; background: none; cursor: pointer; font-weight: 600; color: #718096;">
                        <i class="fas fa-map-marked-alt me-2"></i>Localizações
                    </button>
                    <button class="tab-btn" onclick="switchTab('devices')" style="flex: 1; padding: 10px; border: none; background: none; cursor: pointer; font-weight: 600; color: #718096;">
                        <i class="fas fa-laptop me-2"></i>Dispositivos
                    </button>
                    <button class="tab-btn" onclick="switchTab('analytics')" style="flex: 1; padding: 10px; border: none; background: none; cursor: pointer; font-weight: 600; color: #718096;">
                        <i class="fas fa-chart-pie me-2"></i>Analytics
                    </button>
                </div>
                
                <!-- Tab Visitantes (com IP) -->
                <div id="tab-visitors" class="tab-content">
                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <h6 style="margin: 0; color: #4a5568;">
                            <i class="fas fa-list me-2"></i>Últimos Visitantes
                        </h6>
                        <button onclick="exportVisitorData()" style="background: #48bb78; color: white; border: none; padding: 8px 15px; border-radius: 6px; font-size: 0.9em; cursor: pointer;">
                            <i class="fas fa-download me-2"></i>Exportar CSV
                        </button>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; max-height: 300px; overflow-y: auto;">
                        ${recentVisitors.length > 0 ? recentVisitors.map((visitor, index) => `
                            <div style="padding: 12px; background: white; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <div>
                                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                            <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 10px;">
                                                ${visitor.deviceType || 'Desconhecido'}
                                            </span>
                                            <span style="font-weight: 600; color: #2d3748;">
                                                ${visitor.city ? `${visitor.city}, ${visitor.country}` : 'Localização não detectada'}
                                            </span>
                                        </div>
                                        <div style="font-size: 0.85em; color: #718096;">
                                            ${visitor.ip ? `<strong>IP:</strong> ${visitor.ip}` : ''}
                                            ${visitor.org ? ` • <strong>Provedor:</strong> ${visitor.org}` : ''}
                                            ${visitor.browser ? ` • ${visitor.browser}` : ''}
                                        </div>
                                    </div>
                                    <div style="text-align: right; min-width: 100px;">
                                        <div style="font-size: 0.9em; color: #667eea; font-weight: 600;">
                                            ${visitor.visitCount || 1} visita(s)
                                        </div>
                                        <div style="font-size: 0.8em; color: #a0aec0;">
                                            ${visitor.formattedLastVisit}
                                        </div>
                                    </div>
                                </div>
                                
                                ${visitor.region || visitor.postalCode ? `
                                <div style="font-size: 0.8em; color: #4a5568; padding-top: 8px; border-top: 1px solid #edf2f7;">
                                    ${visitor.region ? `<span style="margin-right: 10px;"><i class="fas fa-map-pin"></i> ${visitor.region}</span>` : ''}
                                    ${visitor.postalCode ? `<span><i class="fas fa-mail-bulk"></i> ${visitor.postalCode}</span>` : ''}
                                </div>
                                ` : ''}
                            </div>
                        `).join('') : `
                            <div style="text-align: center; padding: 30px; color: #a0aec0;">
                                <i class="fas fa-users fa-2x mb-3"></i>
                                <div>Nenhum visitante detalhado registrado ainda</div>
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- Tab Localizações -->
                <div id="tab-locations" class="tab-content" style="display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                            <h6 style="margin: 0 0 10px 0; color: #4a5568;">
                                <i class="fas fa-globe-americas me-2"></i>Cidades
                            </h6>
                            ${stats.cities ? Object.entries(stats.cities).map(([city, count]) => `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="font-size: 0.9em;">${city}</span>
                                    <span style="font-weight: 600; color: #667eea; background: #ebf4ff; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">
                                        ${count}
                                    </span>
                                </div>
                            `).join('') : '<div style="color: #a0aec0; font-size: 0.9em;">Nenhuma cidade registrada</div>'}
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                            <h6 style="margin: 0 0 10px 0; color: #4a5568;">
                                <i class="fas fa-map me-2"></i>Regiões/Estados
                            </h6>
                            ${stats.regions ? Object.entries(stats.regions).map(([region, count]) => `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="font-size: 0.9em;">${region}</span>
                                    <span style="font-weight: 600; color: #48bb78; background: #f0fff4; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">
                                        ${count}
                                    </span>
                                </div>
                            `).join('') : '<div style="color: #a0aec0; font-size: 0.9em;">Nenhuma região registrada</div>'}
                        </div>
                    </div>
                </div>
                
                <!-- Tab Dispositivos -->
                <div id="tab-devices" class="tab-content" style="display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                            <h6 style="margin: 0 0 10px 0; color: #4a5568;">
                                <i class="fas fa-mobile-alt me-2"></i>Dispositivos
                            </h6>
                            ${stats.devicesType ? Object.entries(stats.devicesType).map(([device, count]) => `
                                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <div style="flex: 1; margin-right: 10px;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                            <span style="font-weight: 600;">${device}</span>
                                            <span style="color: #667eea;">${count}</span>
                                        </div>
                                        <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                            <div style="height: 100%; background: #667eea; border-radius: 3px; width: ${(count / stats.total * 100)}%"></div>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<div style="color: #a0aec0;">Nenhum dado disponível</div>'}
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                            <h6 style="margin: 0 0 10px 0; color: #4a5568;">
                                <i class="fas fa-window-maximize me-2"></i>Navegadores
                            </h6>
                            ${stats.browsers ? Object.entries(stats.browsers).map(([browser, count]) => `
                                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <div style="flex: 1; margin-right: 10px;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                            <span style="font-weight: 600;">${browser}</span>
                                            <span style="color: #48bb78;">${count}</span>
                                        </div>
                                        <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                            <div style="height: 100%; background: #48bb78; border-radius: 3px; width: ${(count / stats.total * 100)}%"></div>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<div style="color: #a0aec0;">Nenhum dado disponível</div>'}
                        </div>
                    </div>
                </div>
                
                <!-- Tab Analytics -->
                <div id="tab-analytics" class="tab-content" style="display: none;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <h6 style="margin: 0 0 10px 0; color: #4a5568;">
                            <i class="fas fa-chart-line me-2"></i>Estatísticas Gerais
                        </h6>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                            <div style="text-align: center;">
                                <div style="font-size: 2em; font-weight: 800; color: #667eea;">${Object.keys(stats.countries || {}).length}</div>
                                <div style="font-size: 0.8em; color: #718096;">Países</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 2em; font-weight: 800; color: #48bb78;">${Object.keys(stats.cities || {}).length}</div>
                                <div style="font-size: 0.8em; color: #718096;">Cidades</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 2em; font-weight: 800; color: #ed8936;">${Object.keys(stats.browsers || {}).length}</div>
                                <div style="font-size: 0.8em; color: #718096;">Navegadores</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button onclick="this.closest('.tab-content').parentElement.remove(); document.querySelector('[style*=\"background: rgba(0,0,0,0.5)\"]').remove()" 
                        style="width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px; 
                               border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 20px;">
                    <i class="fas fa-times me-2"></i>Fechar Dashboard
                </button>
            </div>
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.5); z-index: 9999;" 
                 onclick="this.remove(); this.previousElementSibling.remove()"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', detailsHTML);
        
        // Adicionar função de troca de tabs
        window.switchTab = function(tabName) {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.style.color = '#718096';
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            event.target.style.color = '#667eea';
            event.target.classList.add('active');
            document.getElementById(`tab-${tabName}`).style.display = 'block';
        };
        
        // Adicionar função de exportação
        window.exportVisitorData = async function() {
            const csvContent = await generateCSV(recentVisitors);
            downloadCSV(csvContent, `visitantes_${new Date().toISOString().split('T')[0]}.csv`);
        };

    } catch (error) {
        console.error('Erro ao mostrar detalhes:', error);
        alert('Erro ao carregar dados dos visitantes');
    }
}

// Função para resetar contador (apenas para desenvolvimento)
function resetVisitorCounter() {
    if (confirm('Tem certeza que deseja resetar o contador de visitantes?')) {
        localStorage.removeItem('comerciante_device_id');
        localStorage.removeItem('last_counted_date');
        localStorage.removeItem('comerciante_total_visits');
        localStorage.removeItem('comerciante_visitor_data');
        
        if (typeof db !== 'undefined') {
            db.collection('site_stats').doc('visitors').set({
                total: 0,
                today: 0,
                devices: [],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastResetDate: new Date().toISOString().split('T')[0]
            });
        }
        
        location.reload();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estilos CSS
    const styles = `
        @keyframes slideIn {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-20px);
                opacity: 0;
            }
        }
        
        #visitor-counter:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        #visitor-counter {
            transition: all 0.3s ease;
        }
        
        .tab-btn.active {
            border-bottom: 3px solid #667eea !important;
            color: #667eea !important;
        }
        
        .tab-content {
            transition: all 0.3s ease;
        }
        
        /* Scrollbar personalizada */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Iniciar contador
    setTimeout(() => {
        initFirebaseVisitorCounter();
    }, 1000);
});



/* ==========================================================
   SISTEMA DE LOGIN ADMINISTRATIVO (FIRESTORE)
   100% FUNCIONANDO — SIMPLES E TESTADO
   ========================================================== */

// Tempo de expiração da sessão (12h)
const SESSION_TIME = 12 * 60 * 60 * 1000;

// HASH SHA-256
async function sha256(text) {
    const buffer = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ----------------------
// LOGIN ADMIN
// ----------------------
async function adminLogin() {
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    if (!username || !password) {
        showLoginMessage("Preencha todos os campos!", "red");
        return;
    }

    const ref = db.collection("admins").doc(username);
    const snap = await ref.get();

    if (!snap.exists) {
        showLoginMessage("Usuário não encontrado!", "red");
        return;
    }

    const data = snap.data();

    // Verificar bloqueio com segurança
if (data.blockedUntil) {
    let blockedDate = null;

    // Caso seja Timestamp do Firestore
    if (typeof data.blockedUntil.toDate === "function") {
        blockedDate = data.blockedUntil.toDate();
    }

    // Caso seja string ou número
    else {
        blockedDate = new Date(data.blockedUntil);
    }

    if (blockedDate > new Date()) {
        showLoginMessage(
            `Usuário bloqueado até ${blockedDate.toLocaleTimeString()}`,
            "red"
        );
        return;
    }
}


    const hashed = await sha256(password);

    if (hashed !== data.passwordHash) {
        const attempts = (data.attempts || 0) + 1;

        if (attempts >= 5) {
            await ref.update({
                attempts: 0,
                blockedUntil: new Date(Date.now() + 15 * 60000) // 15 minutos
            });

            showLoginMessage("Muitas tentativas. Usuário bloqueado por 15 min.", "red");
            return;
        }

        await ref.update({ attempts });

        showLoginMessage(`Senha incorreta. Tentativas: ${attempts}/5`, "red");
        return;
    }

    // Reset tentativas
    await ref.update({
        attempts: 0,
        blockedUntil: null
    });

    // Criar sessão
    localStorage.setItem(
        "adminSession",
        JSON.stringify({
            username,
            expiresAt: Date.now() + SESSION_TIME
        })
    );

    showLoginMessage("Login efetuado! Redirecionando…", "green");

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 800);
}

// ----------------------
// MENSAGEM NO MODAL
// ----------------------
function showLoginMessage(msg, color) {
    const box = document.getElementById("loginMessage");
    box.style.display = "block";
    box.style.background = color === "red" ? "#fed7d7" : "#c6f6d5";
    box.style.color = color === "red" ? "#c53030" : "#2f855a";
    box.innerText = msg;
}

// ----------------------
// ABRIR E FECHAR MODAL
// ----------------------
function openLoginModal() {
    document.getElementById("adminLoginModal").style.display = "flex";
}
function closeLoginModal() {
    document.getElementById("adminLoginModal").style.display = "none";
}

// ----------------------
// VERIFICAR SESSÃO NA DASHBOARD
// ----------------------
function checkAdminSession() {
    const session = JSON.parse(localStorage.getItem("adminSession"));
    const now = Date.now();

    if (!session || now > session.expiresAt) {
        localStorage.removeItem("adminSession");
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// ----------------------
// LOGOUT
// ----------------------
function adminLogout() {
    localStorage.removeItem("adminSession");
    window.location.href = "login.html";
}







// ===== BOTÃO DIAMANTE SUSPENSO =====

// Inicializar botão diamante
function initFloatingDiamond() {
    const diamondBtn = document.getElementById('floatingDiamondBtn');
    
    if (!diamondBtn) {
        console.error('Botão diamante não encontrado');
        return;
    }
    
    // Mostrar/ocultar baseado no scroll
    window.addEventListener('scroll', function() {
        toggleFloatingDiamond();
    });
    
    // Adicionar clique suave
    diamondBtn.addEventListener('click', function(e) {
        e.preventDefault();
        scrollToTopWithDiamondEffect();
    });
    
    // Verificar estado inicial
    toggleFloatingDiamond();
    
    // Adicionar efeito de clique
    diamondBtn.addEventListener('mousedown', function() {
        this.classList.add('clicked');
    });
    
    diamondBtn.addEventListener('mouseup', function() {
        setTimeout(() => {
            this.classList.remove('clicked');
        }, 600);
    });
    
    diamondBtn.addEventListener('mouseleave', function() {
        this.classList.remove('clicked');
    });
}

// Mostrar/ocultar diamante
function toggleFloatingDiamond() {
    const diamondBtn = document.getElementById('floatingDiamondBtn');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 500) {
        diamondBtn.classList.add('visible');
    } else {
        diamondBtn.classList.remove('visible');
    }
}

// Scroll com efeito especial
function scrollToTopWithDiamondEffect() {
    const diamondBtn = document.getElementById('floatingDiamondBtn');
    
    // Efeito visual de clique
    diamondBtn.classList.add('clicked');
    
    // Efeito de partículas (opcional)
    createDiamondParticles();
    
    // Scroll suave para o topo
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Remover classe após animação
    setTimeout(() => {
        diamondBtn.classList.remove('clicked');
    }, 600);
    
    // Efeito sonoro opcional
    playCrystalSound();
}

// Criar partículas de brilho (efeito opcional)
function createDiamondParticles() {
    const diamondBtn = document.getElementById('floatingDiamondBtn');
    if (!diamondBtn) return;
    
    const rect = diamondBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Criar 10 partículas
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'diamond-particle';
        
        // Posição inicial
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        
        // Tamanho aleatório
        const size = Math.random() * 6 + 3;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Cor e efeitos
        particle.style.background = 'rgba(255, 255, 255, 0.9)';
        particle.style.borderRadius = '50%';
        particle.style.position = 'fixed';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9998';
        particle.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
        
        // Adicionar ao body
        document.body.appendChild(particle);
        
        // Animação
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50;
        const duration = Math.random() * 800 + 400;
        
        particle.animate([
            {
                transform: `translate(0, 0) scale(1)`,
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)'
        });
        
        // Remover após animação
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, duration);
    }
}

// Efeito sonoro de cristal (opcional)
function playCrystalSound() {
    try {
        // Criar áudio sintetizado para efeito de cristal
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar som de cristal
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1567.98, audioContext.currentTime); // Sol#6
        oscillator.frequency.exponentialRampToValueAtTime(2093.00, audioContext.currentTime + 0.2); // Dó7
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
    } catch (error) {
        console.log('Efeito sonoro não disponível');
    }
}


// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', initFloatingDiamond);

// Inicialização alternativa para SPAs
if (typeof STATE !== 'undefined') {
    setTimeout(initFloatingDiamond, 1000);
}