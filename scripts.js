
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
        
        const snapshot = await query.limit(50).get();
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
                                <h4>Descrição</h4>
                                <p class="product-description-text">${product.description}</p>
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

function addToCartFromDetail(productId) {
    const quantityInput = document.getElementById('detailQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    console.log('🛒 Adicionando do detalhe:', productId, 'Quantidade:', quantity);
    
    const product = STATE.products.find(p => p.id === productId);
    
    if (!product) {
        showMessage('Produto não encontrado.', 'error');
        return;
    }

    if (product.stock <= 0) {
        showMessage('Produto fora de estoque.', 'warning');
        return;
    }

    // Verificar se a quantidade solicitada está disponível
    const existingItem = STATE.cart.find(item => item.id === productId);
    const totalInCart = existingItem ? existingItem.quantity : 0;
    
    if (totalInCart + quantity > product.stock) {
        showMessage(`Quantidade indisponível. Disponível: ${product.stock - totalInCart} unidades.`, 'warning');
        return;
    }

    // Adicionar ao carrinho
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        STATE.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageURL: product.imageURL,
            stock: product.stock,
            quantity: quantity,
            cartId: generateId()
        });
    }

    updateCartUI();
    showMessage(`✅ ${quantity}x ${product.name} adicionado ao carrinho!`, 'success');
    cacheData('shoppingCart', STATE.cart);
    
    // Fechar modal após adicionar (opcional)
    setTimeout(() => {
        closeProductModal();
    }, 1500);
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
    window.open('admin.html', '_blank');
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


// ===== CARRINHO DE COMPRAS =====
function addToCart(productId) {
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

    // Atualizar interface do carrinho
    updateCartUI();
    
    // Mostrar mensagem de sucesso
    showMessage('✅ ' + product.name + ' adicionado ao carrinho!', 'success');
    
    // Salvar carrinho no localStorage
    cacheData('shoppingCart', STATE.cart);
    
    // Abrir carrinho automaticamente (opcional)
    // if (!STATE.isCartOpen) {
    //     toggleCart();
    // }
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

