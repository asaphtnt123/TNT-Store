
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
        name: "Quero'Luxo Joias & Semijoias Importadas",
        description: "Melhores preços em joias e acessórios",
        whatsapp: "5519996249702",
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

// No início do seu arquivo, adicione estas variáveis ao STATE
STATE.pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    hasMore: true,
    lastVisible: null, // Para paginação com Firestore
    loading: false
};

// Adicione no início do arquivo, após as constantes
let lastClickTime = 0;
const CLICK_DELAY = 500; // 500ms entre cliques

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Modifique a inicialização para incluir o contador
async function initializeApp() {
    try {
        showLoading();
        console.log('🚀 Inicializando aplicação...');
        
        await initializeFirebase();
        setupOfflineListener();
        await loadInitialData();
        await loadExclusiveProducts();
        await loadFeaturedProducts();
        
        // Cria a seção de produtos da categoria se não existir
        createCategoryProductsSection();
        
        setupEventListeners();
        updateCartUI();
        setupConfigListener();
        
        // Inicializar contador de visitantes (com delay para não atrapalhar carregamento)
        setTimeout(() => {
            initVisitorCounter();
        }, 2000);
        
        // Se não há categoria selecionada, mostra mensagem de boas-vindas
        if (!STATE.currentCategory && STATE.products.length === 0) {
            displayWelcomeMessage();
        }
        
        hideLoading();
        showMessage('Loja carregada com sucesso!', 'success');
        console.log('🎉 Aplicação inicializada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showMessage('Carregando em modo offline...', 'warning');
        loadCachedData();
        
        // Tentar contador mesmo em modo offline
        setTimeout(() => {
            initSimpleCounter();
        }, 1000);
    }
}

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
async function initializeHomePage() {
    try {
        showLoading();
        console.log('🚀 Inicializando página inicial...');
        
        await initializeFirebase();
        setupOfflineListener();
        await loadStoreConfig();
        await loadCategories();
        
        // Na home, só carrega produtos exclusivos e em destaque
        await loadExclusiveProducts();
        await loadFeaturedProducts();
        
        // Cria links para as categorias
        createCategoryLinks();
        
        setupEventListeners();
        updateCartUI();
        
        // Não carrega todos os produtos na home
        hideLoading();
        
        console.log('🎉 Página inicial carregada!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showMessage('Carregando em modo offline...', 'warning');
        loadCachedData();
    }
}


// Modifique a função initializeApp para páginas de categoria
async function initializeCategoryPage() {
    try {
        showLoading();
        console.log('🚀 Inicializando página de categoria...');
        
        await initializeFirebase();
        setupOfflineListener();
        await loadStoreConfig();
        await loadCategories();
        
        // Carrega os produtos da categoria atual
        await loadCategoryPage();
        
        setupEventListeners();
        updateCartUI();
        
        hideLoading();
        
        console.log('🎉 Página de categoria carregada!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showMessage('Carregando em modo offline...', 'warning');
        loadCachedData();
    }
}

// Detectar tipo de página e inicializar apropriadamente
document.addEventListener('DOMContentLoaded', function() {
    const isHomePage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/');
    
    if (isHomePage) {
        initializeHomePage();
    } else {
        // Assume que é uma página de categoria
        initializeCategoryPage();
    }
});


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


// Modifique a função displayWelcomeMessage para usar o container correto
function displayWelcomeMessage() {
    const container = getCategoryProductsContainer();
    if (!container) return;
    
    container.innerHTML = `
        <div class="welcome-container" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <i class="fas fa-gem" style="font-size: 64px; color: #667eea; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 15px; font-weight: 600;">Bem-vindo à ${STATE.storeConfig.name || 'Nossa Loja'}!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Explore nossas coleções exclusivas e produtos em destaque. 
                    Selecione uma categoria no menu para ver todos os produtos.
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 20px; margin: 40px 0;">
                    <div style="background: linear-gradient(135deg, #667eea15, #764ba215); padding: 20px; border-radius: 15px; border-left: 4px solid #667eea;">
                        <h4 style="color: #667eea; margin-bottom: 10px;">
                            <i class="fas fa-crown me-2"></i> Produtos Exclusivos
                        </h4>
                        <p style="color: #555; margin: 0; font-size: 14px;">
                            Itens selecionados especialmente para você com qualidade premium.
                        </p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #ed893615, #dd6b2015); padding: 20px; border-radius: 15px; border-left: 4px solid #ed8936;">
                        <h4 style="color: #ed8936; margin-bottom: 10px;">
                            <i class="fas fa-star me-2"></i> Produtos em Destaque
                        </h4>
                        <p style="color: #555; margin: 0; font-size: 14px;">
                            Os produtos mais populares e bem avaliados pelos nossos clientes.
                        </p>
                    </div>
                </div>
                
                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 14px; margin-bottom: 20px;">
                        Dica: Use o menu de categorias para navegar por todos os produtos
                    </p>
                    ${STATE.categories.length > 0 ? `
                        <button class="btn-primary" onclick="handleCategoryClick('${STATE.categories[0].id}')" 
                                style="padding: 12px 30px; border-radius: 25px; font-size: 15px;">
                            <i class="fas fa-th-large me-2"></i> Ver Todos os Produtos
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}
// Função para carregar a primeira categoria
async function loadFirstCategory() {
    if (STATE.categories.length > 0) {
        await loadProductsByCategory(STATE.categories[0].id);
    } else {
        await loadProducts(); // Carrega todos os produtos se não houver categorias
    }
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
async function loadProducts(categoryId = null, loadMore = false) {
    try {
        // Evitar múltiplos carregamentos
        if (STATE.pagination.loading) {
            console.log('⚠️ Já está carregando, aguarde...');
            return;
        }
        
        STATE.pagination.loading = true;
        
        // Reset para nova categoria ou primeira carga
        if (!loadMore) {
            STATE.pagination.currentPage = 1;
            STATE.pagination.lastVisible = null;
            STATE.pagination.hasMore = true;
            STATE.products = [];
        } else {
            console.log(`⬇️ Carregando página ${STATE.pagination.currentPage + 1}...`);
        }
        
        // Construir query
        let query = db.collection('products').orderBy('createdAt', 'desc');
        
        if (categoryId) {
            query = query.where('categoryId', '==', categoryId);
        }
        
        // Para paginação, usar limit + 1 para verificar se há mais
        const limit = STATE.pagination.itemsPerPage;
        query = query.limit(loadMore ? limit : limit + 1);
        
        // Usar cursor para paginação
        if (loadMore && STATE.pagination.lastVisible) {
            query = query.startAfter(STATE.pagination.lastVisible);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            console.log('📭 Nenhum produto encontrado');
            STATE.pagination.hasMore = false;
            
            if (!loadMore) {
                // Mostrar estado vazio apenas na primeira carga
                showEmptyState();
            }
            
            return;
        }
        
        const docs = snapshot.docs;
        console.log(`✅ ${docs.length} documentos recebidos`);
        
        // Verificar se há mais produtos
        STATE.pagination.hasMore = !loadMore ? docs.length > limit : docs.length === limit;
        
        // Pegar apenas os produtos necessários
        const productsToAdd = !loadMore && docs.length > limit 
            ? docs.slice(0, limit) 
            : docs;
        
        // Atualizar lastVisible para próxima página
        if (productsToAdd.length > 0) {
            STATE.pagination.lastVisible = productsToAdd[productsToAdd.length - 1];
        }
        
        // Converter documentos para produtos
        const newProducts = productsToAdd.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`🎁 Adicionando ${newProducts.length} novos produtos`);
        
        // Adicionar aos produtos existentes ou substituir
        if (loadMore) {
            STATE.products = [...STATE.products, ...newProducts];
            STATE.pagination.currentPage++;
        } else {
            STATE.products = newProducts;
        }
        
        // Atualizar contagem
        STATE.pagination.totalItems = STATE.products.length;
        
        console.log(`📊 Total de produtos: ${STATE.products.length}`);
        console.log(`➡️ Há mais produtos? ${STATE.pagination.hasMore}`);
        
        // Exibir produtos com paginação
        displayProductsWithPagination(STATE.products);
        
        // Marcar que não é mais carga inicial
        STATE.pagination.isInitialLoad = false;
        
    } catch (error) {
        console.error('❌ ERRO ao carregar produtos:', error);
        showMessage('Erro ao carregar produtos. Tente novamente.', 'error');
        
        // Em caso de erro, garantir que hasMore seja false para evitar loops
        STATE.pagination.hasMore = false;
        
    } finally {
        // IMPORTANTE: Sempre resetar o estado de loading
        STATE.pagination.loading = false;
        
        // Atualizar botão
        updateLoadMoreButton();
        console.log('🏁 Estado de loading finalizado');
    }
}


// Função para carregar mais produtos
async function loadMoreProducts() {
    console.log('🎯 loadMoreProducts chamado');
    
    if (!STATE.pagination.hasMore) {
        console.log('⏹️ Não há mais produtos para carregar');
        return;
    }
    
    if (STATE.pagination.loading) {
        console.log('⏳ Já está carregando...');
        return;
    }
    
    console.log(`📥 Carregando página ${STATE.pagination.currentPage + 1}...`);
    await loadProducts(STATE.currentCategory, true);
}

// Função showEmptyState corrigida
function showEmptyState() {
    const container = getCategoryProductsContainer();
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <i class="fas fa-box-open" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">Nenhum produto encontrado</h3>
            <p style="color: #999;">Tente outra categoria ou volte mais tarde</p>
        </div>
    `;
}


// Função para criar a seção de categoria dinamicamente
function createCategoryProductsSection() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return null;
    
    // Verifica se já existe
    if (document.getElementById('categoryProductsSection')) {
        return document.getElementById('selectedCategoryProducts');
    }
    
    // Cria a seção
    const categorySection = document.createElement('section');
    categorySection.className = 'category-products';
    categorySection.id = 'categoryProductsSection';
    categorySection.style.cssText = 'margin: 40px 0;';
    
    categorySection.innerHTML = `
        <div class="container">
            <div class="section-header">
                <h2 id="categoryTitle">Produtos</h2>
            </div>
            <div id="selectedCategoryProducts" class="products-grid">
                <!-- Produtos serão carregados aqui -->
            </div>
        </div>
    `;
    
    // Insere após a seção de subcategorias ou no início do main
    const subcategoryNav = document.querySelector('.subcategory-nav');
    if (subcategoryNav) {
        subcategoryNav.insertAdjacentElement('afterend', categorySection);
    } else {
        const firstSection = mainContent.querySelector('section');
        if (firstSection) {
            firstSection.insertAdjacentElement('beforebegin', categorySection);
        } else {
            mainContent.prepend(categorySection);
        }
    }
    
    return document.getElementById('selectedCategoryProducts');
}

// Função para criar botões de categoria (agora com event listeners adequados)
function displayCategories() {
    const container = document.querySelector('.category-buttons');
    if (!container || STATE.categories.length === 0) {
        if (container) {
            container.innerHTML = '<p style="color: #666; padding: 20px; text-align: center;">Carregando categorias...</p>';
        }
        return;
    }
    
    console.log(`📂 Exibindo ${STATE.categories.length} categorias`);
    
    container.innerHTML = STATE.categories.map(category => `
        <button class="category-btn" 
                data-category-id="${category.id}"
                onclick="handleCategoryClick('${category.id}')">
            <i class="fas fa-folder"></i> ${category.name}
        </button>
    `).join('');
    
    // Se não há categoria selecionada, mostra mensagem de boas-vindas
    if (!STATE.currentCategory && STATE.products.length === 0) {
        displayWelcomeMessage();
    }
}



// Handler para clique em categoria
async function handleCategoryClick(categoryId) {
    console.log(`🎯 Clicou na categoria: ${categoryId}`);
    
    // Verificar se já está carregando
    if (STATE.pagination.loading) {
        console.log('⏳ Já está carregando...');
        return;
    }
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active ao botão clicado
    const clickedBtn = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Carregar produtos da categoria
    await loadProductsByCategory(categoryId);
}



// Função principal para carregar produtos por categoria
async function loadProductsByCategory(categoryId) {
    try {
        console.log(`📂 Carregando categoria: ${categoryId}`);
        
        // Atualizar estado
        STATE.currentCategory = categoryId;
        STATE.currentSubcategory = null;
        
        // Resetar paginação
        STATE.pagination.currentPage = 1;
        STATE.pagination.lastVisible = null;
        STATE.pagination.hasMore = true;
        
        // Mostrar loading
        showCategoryLoading();
        
        // Carregar produtos
        await loadProducts(categoryId, false);
        
        // Mostrar subcategorias
        displaySubcategories(categoryId);
        
        // Atualizar título
        updateCategoryTitle(categoryId);
        
    } catch (error) {
        console.error('❌ Erro ao carregar categoria:', error);
        showMessage('Erro ao carregar produtos.', 'error');
        showErrorState('Erro ao carregar produtos. Tente novamente.');
    }
}


// Função para atualizar título da categoria
function updateCategoryTitle(categoryId) {
    const category = STATE.categories.find(cat => cat.id === categoryId);
    const titleElement = document.getElementById('categoryTitle');
    
    if (titleElement && category) {
        titleElement.textContent = category.name;
        
        // Role a página até a seção de produtos
        const categorySection = document.getElementById('categoryProductsSection');
        if (categorySection) {
            categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}


// Função para mostrar estado de erro
function showErrorState(message) {
    const container = getCategoryProductsContainer();
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">Erro</h3>
            <p style="color: #999;">${message}</p>
        </div>
    `;
}


// Função para mostrar loading na seção de categoria
function showCategoryLoading() {
    const container = getCategoryProductsContainer();
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-container" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea; border-radius: 50%; margin: 0 auto 20px;
                animation: spin 1s linear infinite;"></div>
            <p style="color: #666; font-size: 16px;">Carregando produtos...</p>
        </div>
    `;
}


// Função para obter o container de produtos (cria se não existir)
function getCategoryProductsContainer() {
    let container = document.getElementById('selectedCategoryProducts');
    
    if (!container) {
        // Tenta criar a seção dinamicamente
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return null;
        
        // Cria a seção de produtos da categoria
        const categorySection = document.createElement('section');
        categorySection.className = 'category-products';
        categorySection.id = 'categoryProductsSection';
        categorySection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <h2 id="categoryTitle">Produtos</h2>
                </div>
                <div id="selectedCategoryProducts" class="products-grid">
                    <!-- Produtos serão carregados aqui -->
                </div>
            </div>
        `;
        
        // Insere após a navegação de categorias
        const categoryNav = document.querySelector('.category-nav');
        if (categoryNav) {
            categoryNav.insertAdjacentElement('afterend', categorySection);
        } else {
            mainContent.insertAdjacentElement('afterbegin', categorySection);
        }
        
        container = document.getElementById('selectedCategoryProducts');
    }
    
    return container;
}

// Função para atualizar botão ativo
function updateActiveCategoryButton(categoryId) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        // Verifica se o botão tem o evento onclick com este categoryId
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(categoryId)) {
            btn.classList.add('active');
        }
    });
}


// Função para carregar todos os produtos da categoria
async function loadAllSubcategoryProducts(categoryId) {
    try {
        console.log(`📂 Carregando TODOS da categoria: ${categoryId}`);
        
        STATE.currentSubcategory = null;
        
        // Mostrar loading
        showCategoryLoading();
        
        // Carregar produtos
        await loadProducts(categoryId, false);
        
        // Atualizar título
        const category = STATE.categories.find(cat => cat.id === categoryId);
        const title = document.getElementById('categoryTitle');
        if (title && category) {
            title.textContent = category.name;
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar todos:', error);
        showMessage('Erro ao carregar produtos.', 'error');
    }
}


// Função para mostrar subcategorias
function displaySubcategories(categoryId) {
    const category = STATE.categories.find(cat => cat.id === categoryId);
    const subcategoryNav = document.getElementById('subcategoryNav');
    const subcategoryButtons = document.getElementById('subcategoryButtons');
    
    if (!category || !category.subcategories || category.subcategories.length === 0) {
        if (subcategoryNav) {
            subcategoryNav.style.display = 'none';
        }
        return;
    }
    
    // Mostrar navegação de subcategorias
    if (subcategoryNav) {
        subcategoryNav.style.display = 'block';
        
        subcategoryButtons.innerHTML = `
            <button class="subcategory-btn active" onclick="handleSubcategoryClick('${categoryId}', 'all')">
                <i class="fas fa-th-large"></i> Todos
            </button>
            ${category.subcategories.map(subcategory => `
                <button class="subcategory-btn" onclick="handleSubcategoryClick('${categoryId}', '${subcategory}')">
                    <i class="fas fa-tag"></i> ${subcategory}
                </button>
            `).join('')}
        `;
    }
}

// Handler para clique em subcategoria
async function handleSubcategoryClick(categoryId, subcategory) {
    console.log(`🎯 Clicou na subcategoria: ${subcategory} da categoria: ${categoryId}`);
    
    if (subcategory === 'all') {
        await loadAllSubcategoryProducts(categoryId);
    } else {
        await loadProductsBySubcategory(categoryId, subcategory);
    }
    
    // Atualizar botões ativos
    document.querySelectorAll('.subcategory-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const clickedBtn = document.querySelector(`[onclick*="${subcategory}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
}

// Função para carregar produtos por subcategoria (CORRIGIDA)
async function loadProductsBySubcategory(categoryId, subcategory) {
    try {
        console.log(`📂 Carregando subcategoria: ${subcategory} da categoria: ${categoryId}`);
        
        STATE.currentCategory = categoryId;
        STATE.currentSubcategory = subcategory;
        
        // Mostrar loading
        showCategoryLoading();
        
        // Carregar TODOS os produtos da categoria primeiro
        await loadProducts(categoryId, false);
        
        // Filtrar produtos pela subcategoria
        const filteredProducts = STATE.products.filter(product => {
            // Comparação mais robusta (case insensitive, trim)
            return product.subcategory && 
                   product.subcategory.trim().toLowerCase() === subcategory.trim().toLowerCase();
        });
        
        console.log(`✅ Encontrados ${filteredProducts.length} produtos na subcategoria "${subcategory}"`);
        
        // Se encontrou produtos, exibir
        if (filteredProducts.length > 0) {
            displayFilteredProducts(filteredProducts, subcategory);
            
            // Atualizar título
            const category = STATE.categories.find(cat => cat.id === categoryId);
            const title = document.getElementById('categoryTitle');
            if (title && category) {
                title.textContent = `${category.name} - ${subcategory}`;
            }
        } else {
            // Mostrar mensagem de nenhum produto encontrado
            showNoProductsMessage(subcategory);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar subcategoria:', error);
        showMessage('Erro ao carregar produtos.', 'error');
    }
}



// Função para mostrar mensagem quando não há produtos
function showNoProductsMessage(subcategory) {
    const container = getCategoryProductsContainer();
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">Nenhum produto encontrado</h3>
            <p style="color: #999;">Não encontramos produtos na subcategoria "${subcategory}"</p>
            ${STATE.currentCategory ? `
                <button class="btn-secondary" onclick="loadAllSubcategoryProducts('${STATE.currentCategory}')" style="margin-top: 15px;">
                    <i class="fas fa-arrow-left"></i> Ver todos os produtos
                </button>
            ` : ''}
        </div>
    `;
}

// Função para exibir produtos filtrados
function displayFilteredProducts(products, subcategory) {
    const container = getCategoryProductsContainer();
    if (!container) return;
    
    if (products.length === 0) {
        showNoProductsMessage(subcategory);
        return;
    }
    
    // Limpar container
    container.innerHTML = '';
    
    // Exibir produtos
    products.forEach(product => {
        const category = STATE.categories.find(cat => cat.id === product.categoryId);
        const isOutOfStock = product.stock <= 0;
injectProductSchema(product, category?.name);

        const productHTML = `
<article class="product-card"
         data-product-id="${product.id}"
         itemscope
         itemtype="https://schema.org/Product">

    <!-- Imagem -->
    <img src="${product.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}"
         alt="Joia feminina ${product.name} em ${category?.name || 'Prata 925 ou Ouro 18K'}"
         class="product-image"
         itemprop="image"
         loading="lazy"
         onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Indisponível'"
         onclick="showProductDetails('${product.id}')">

    <div class="product-info">

        <!-- Nome -->
        <h3 class="product-title" itemprop="name">
            ${product.name}
        </h3>

        <!-- Marca -->
        <meta itemprop="brand" content="Quero'Luxo Joias">

        <!-- Categoria -->
        <meta itemprop="category" content="${category?.name || 'Joias Femininas'}">

        <!-- Preço -->
        <div class="product-price"
             itemprop="offers"
             itemscope
             itemtype="https://schema.org/Offer">

            <meta itemprop="priceCurrency" content="BRL">
            <meta itemprop="price" content="${product.price}">
            <link itemprop="availability"
                  href="https://schema.org/${isOutOfStock ? 'OutOfStock' : 'InStock'}">

            <strong>R$ ${formatPrice(product.price)}</strong>
        </div>

        <!-- Descrição -->
        ${product.description ? `
            <p class="product-description" itemprop="description">
                ${product.description.substring(0, 120)}...
            </p>
        ` : ''}

        <!-- Informações extras -->
        <div class="product-meta">
            <span class="product-category">
                ${category?.name || 'Joias Femininas'}
            </span>

            ${product.subcategory ? `
                <span class="product-subcategory">
                    ${product.subcategory}
                </span>
            ` : ''}

            <span class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                ${isOutOfStock ? 'Produto esgotado' : `${product.stock} disponíveis`}
            </span>
        </div>

        <!-- Ações -->
        <div class="product-actions">
            <button class="btn-secondary"
                    onclick="showProductDetails('${product.id}')"
                    aria-label="Ver detalhes do produto ${product.name}">
                <i class="fas fa-eye"></i> Detalhes
            </button>

            <button class="btn-primary"
                    onclick="addToCart('${product.id}')"
                    ${isOutOfStock ? 'disabled' : ''}
                    aria-label="Adicionar ${product.name} ao carrinho">
                <i class="fas fa-shopping-bag"></i>
                ${isOutOfStock ? 'Esgotado' : 'Comprar'}
            </button>
        </div>

    </div>
</article>
`;

        container.insertAdjacentHTML('beforeend', productHTML);
    });
    
    // Adicionar botão voltar para todos
    const backButtonHTML = `
        <div class="subcategory-back" style="grid-column: 1 / -1; text-align: center; margin-top: 20px; padding: 20px;">
            <button class="btn-secondary" onclick="loadAllSubcategoryProducts('${STATE.currentCategory}')">
                <i class="fas fa-arrow-left"></i> Ver todos os produtos da categoria
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', backButtonHTML);
}


// Função para mostrar loading
function showLoading() {
    const container = document.getElementById('selectedCategoryProducts');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-container" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea; border-radius: 50%; margin: 0 auto 20px;
                animation: spin 1s linear infinite;"></div>
            <p style="color: #666; font-size: 16px;">Carregando produtos...</p>
        </div>
    `;
}

// Adicione esta animação no CSS
const loadingStyle = document.createElement('style');
loadingStyle.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
    }
    
    .error-state {
        background: #fff5f5;
        border: 1px solid #fed7d7;
        border-radius: 10px;
        padding: 40px 20px;
    }
    
    .subcategory-back {
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
        margin-top: 30px;
    }
`;
document.head.appendChild(loadingStyle);
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


// Modifique a função displayProductsList para usar o container correto
function displayProductsList(products) {
    const container = getCategoryProductsContainer();
    if (!container) {
        console.error('❌ Container de produtos não encontrado');
        return;
    }
    
    // Limpar container apenas na primeira página
    if (STATE.pagination.currentPage === 1) {
        container.innerHTML = '';
    }
    
    // Se não há produtos, mostrar estado vazio
    if (!products || products.length === 0) {
        if (STATE.pagination.currentPage === 1) {
            showEmptyState();
        }
        return;
    }
    
    console.log(`🎨 Exibindo ${products.length} produtos no container`);
    
    // Gerar HTML dos produtos
    const productsHTML = products.map(product => {
    const category = STATE.categories.find(cat => cat.id === product.categoryId);
    const isOutOfStock = product.stock <= 0;
    injectProductSchema(product, category?.name);
    


    return `
    <article class="product-card"
             data-product-id="${product.id}"
             itemscope
             itemtype="https://schema.org/Product">

        <!-- Imagem do Produto -->
        <img src="${product.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}"
             alt="Joia feminina ${product.name} em ${category?.name || 'Prata 925 ou Ouro 18K'}"
             class="product-image"
             itemprop="image"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Indisponível'"
             onclick="showProductDetails('${product.id}')">

        <div class="product-info">

            <!-- Nome -->
            <h3 class="product-title" itemprop="name">
                ${product.name}
            </h3>

            <!-- Marca -->
            <meta itemprop="brand" content="Quero'Luxo Joias">

            <!-- Categoria -->
            <meta itemprop="category" content="${category?.name || 'Joias Femininas'}">

            <!-- Oferta / Preço -->
            <div class="product-price"
                 itemprop="offers"
                 itemscope
                 itemtype="https://schema.org/Offer">

                <meta itemprop="priceCurrency" content="BRL">
                <meta itemprop="price" content="${product.price}">
                <link itemprop="availability"
                      href="https://schema.org/${isOutOfStock ? 'OutOfStock' : 'InStock'}">

                <strong>R$ ${formatPrice(product.price)}</strong>
            </div>

            <!-- Descrição -->
            ${product.description ? `
                <p class="product-description" itemprop="description">
                    ${product.description.substring(0, 120)}...
                </p>
            ` : ''}

            <!-- Meta informações -->
            <div class="product-meta">
                <span class="product-category">
                    ${category?.name || 'Joias Femininas'}
                </span>

                ${product.subcategory ? `
                    <span class="product-subcategory">
                        ${product.subcategory}
                    </span>
                ` : ''}

                <span class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                    ${isOutOfStock ? 'Produto esgotado' : `${product.stock} disponíveis`}
                </span>
            </div>

            <!-- Ações -->
            <div class="product-actions">
                <button class="btn-secondary"
                        onclick="showProductDetails('${product.id}')"
                        aria-label="Ver detalhes do produto ${product.name}">
                    <i class="fas fa-eye"></i> Detalhes
                </button>

                <button class="btn-primary"
                        onclick="addToCart('${product.id}')"
                        ${isOutOfStock ? 'disabled' : ''}
                        aria-label="Adicionar ${product.name} ao carrinho">
                    <i class="fas fa-shopping-bag"></i>
                    ${isOutOfStock ? 'Esgotado' : 'Comprar'}
                </button>
            </div>

        </div>
    </article>
    `;
}).join('');

    
    // Adicionar produtos ao container
    container.insertAdjacentHTML('beforeend', productsHTML);
    
    // Adicionar/atualizar botão de carregar mais
    updateLoadMoreUI();
    
    console.log('✅ Produtos exibidos com sucesso');
}


// Nova função para atualizar a UI de carregar mais
function updateLoadMoreUI() {
    const container = document.getElementById('selectedCategoryProducts');
    if (!container) return;
    
    // Remover botão existente
    const existingButton = document.getElementById('loadMoreBtn');
    const existingContainer = document.getElementById('loadMoreContainer');
    const existingEnd = document.querySelector('.pagination-end');
    
    if (existingButton) existingButton.remove();
    if (existingContainer) existingContainer.remove();
    if (existingEnd) existingEnd.remove();
    
    // Verificar se deve mostrar botão
    if (STATE.pagination.hasMore && STATE.products.length > 0) {
        const loadMoreHTML = `
            <div class="load-more-container" id="loadMoreContainer" style="grid-column: 1 / -1; text-align: center; margin: 40px 0;">
                <button id="loadMoreBtn" class="load-more-btn" 
                        onclick="loadMoreProducts()"
                        ${STATE.pagination.loading ? 'disabled' : ''}
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                               color: white; border: none; padding: 12px 30px; 
                               border-radius: 25px; font-size: 14px; cursor: pointer; 
                               transition: all 0.3s ease; display: inline-flex; 
                               align-items: center; gap: 8px;">
                    <i class="fas fa-sync-alt ${STATE.pagination.loading ? 'fa-spin' : ''}"></i>
                    ${STATE.pagination.loading ? 'Carregando...' : 'Carregar mais produtos'}
                </button>
                <div class="pagination-info" style="margin-top: 10px; color: #666; font-size: 12px;">
                    Mostrando ${STATE.products.length} produtos
                    ${STATE.pagination.hasMore ? ' (há mais para carregar)' : ''}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', loadMoreHTML);
        
    } else if (STATE.products.length > 0) {
        // Mostrar mensagem de fim
        const endHTML = `
            <div class="pagination-end" style="grid-column: 1 / -1; text-align: center; 
                    padding: 30px; color: #28a745; background: #f8f9fa; 
                    border-radius: 10px; margin: 20px 0;">
                <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                <p style="margin: 0; font-weight: 500;">Todos os produtos carregados</p>
                <p class="pagination-total" style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
                    Total: ${STATE.products.length} produtos
                </p>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', endHTML);
    }
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
    <article class="product-card exclusive-card ${isOutOfStock ? 'out-of-stock-card' : ''}"
             itemscope
             itemtype="https://schema.org/Product"
             data-product-id="${product.id}">

        <!-- Badge Exclusivo -->
        <div class="exclusive-badge">🎯 Exclusivo</div>

        <!-- Overlay Esgotado -->
        ${isOutOfStock ? '<div class="out-of-stock-overlay">Esgotado</div>' : ''}

        <!-- Imagem -->
        <img src="${product.imageURL || 'https://via.placeholder.com/300x300?text=Produto'}"
             alt="Joia exclusiva feminina ${product.name}"
             class="product-image ${isOutOfStock ? 'grayscale' : ''}"
             itemprop="image"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x300?text=Imagem+Indisponível'"
             onclick="${isOutOfStock ? '' : `showProductDetails('${product.id}')`}">

        <div class="product-info">

            <!-- Nome -->
            <h3 class="product-title" itemprop="name">
                ${product.name}
            </h3>

            <!-- Marca -->
            <meta itemprop="brand" content="Quero'Luxo Joias">

            <!-- Categoria -->
            <meta itemprop="category" content="Joias Exclusivas Femininas">

            <!-- Preço / Oferta -->
            <div class="product-price"
                 itemprop="offers"
                 itemscope
                 itemtype="https://schema.org/Offer">

                <meta itemprop="priceCurrency" content="BRL">
                <meta itemprop="price" content="${product.price}">
                <link itemprop="availability"
                      href="https://schema.org/${isOutOfStock ? 'OutOfStock' : 'InStock'}">

                <strong>R$ ${formatPrice(product.price)}</strong>
            </div>

            <!-- Estoque -->
            <div class="product-meta">
                <span class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                    ${isOutOfStock ? 'Produto esgotado' : `${product.stock} disponíveis`}
                </span>
            </div>

            <!-- Ações -->
            <div class="product-actions">
                <button class="btn-secondary"
                        onclick="showProductDetails('${product.id}')"
                        aria-label="Ver detalhes do produto exclusivo ${product.name}">
                    <i class="fas fa-eye"></i> Detalhes
                </button>

                <button class="btn-primary"
                        onclick="addToCart('${product.id}')"
                        ${isOutOfStock ? 'disabled' : ''}
                        aria-label="Adicionar ${product.name} ao carrinho">
                    <i class="fas fa-shopping-bag"></i>
                    ${isOutOfStock ? 'Esgotado' : 'Comprar'}
                </button>
            </div>

        </div>
    </article>
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

function confirmPurchase() {
    console.log('🛍️ Confirmando compra');

    const name = document.getElementById('name')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const deliveryOption = document.getElementById('deliveryOption')?.value;
    const troco = document.getElementById('troco')?.value;

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

        // 🔐 SALVAR PEDIDO CONCLUÍDO
        localStorage.setItem('lastOrderCompleted', JSON.stringify({
            date: Date.now(),
            products: STATE.cart.map(item => ({
                productId: item.id,
                name: item.name
            }))
        }));

       // 📊 Google Analytics – Purchase (WhatsApp)
if (typeof gtag === 'function') {
    gtag('event', 'purchase', {
        transaction_id: 'whatsapp_' + Date.now(),
        value: getCartTotal(),
        currency: 'BRL',
        method: 'whatsapp',
        items: STATE.cart.map(item => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    });
}



        window.open(whatsappUrl, '_blank');

        closeCheckoutModal();
        clearCart();

        showMessage('✅ Pedido enviado com sucesso!', 'success');

    } catch (error) {
        console.error('❌ Erro ao finalizar pedido:', error);
        showMessage('Erro ao enviar pedido. Tente novamente.', 'error');
    }
}


// 🧮 Total do carrinho
function getCartTotal() {
    if (!STATE.cart || STATE.cart.length === 0) return 0;

    return STATE.cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}



document.addEventListener('DOMContentLoaded', () => {
    checkPendingReview();
});
function checkPendingReview() {
    const orderData = localStorage.getItem('lastOrderCompleted');

    if (!orderData) return;

    if (localStorage.getItem('reviewModalShown')) return;

    const parsed = JSON.parse(orderData);

    const elapsed = Date.now() - parsed.date;
    const MAX_TIME = 1000 * 60 * 60 * 24; // 24h

    if (elapsed > MAX_TIME) {
        localStorage.removeItem('lastOrderCompleted');
        localStorage.removeItem('reviewModalShown');
        return;
    }

    localStorage.setItem('reviewModalShown', 'true');

    openPostPurchaseReviewModal(parsed.products);
}


function openPostPurchaseReviewModal(products) {
    const modal = document.getElementById('reviewAfterPurchaseModal');

    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-content">
            <h3>⭐ Avalie sua experiência</h3>
            <p>Sua opinião é muito importante para nós.</p>

            ${products.map(p => `
                <div class="review-product-item">
                    <strong>${p.name}</strong>

                    <select id="rating-${p.productId}">
                        <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                        <option value="4">⭐⭐⭐⭐ Muito bom</option>
                        <option value="3">⭐⭐⭐ Bom</option>
                        <option value="2">⭐⭐ Regular</option>
                        <option value="1">⭐ Ruim</option>
                    </select>

                    <textarea id="comment-${p.productId}"
                        placeholder="Conte sua experiência"></textarea>

                    <button onclick="submitPostPurchaseReview('${p.productId}')">
                        Enviar Avaliação
                    </button>
                </div>
            `).join('')}

            <button class="close-modal" onclick="closePostPurchaseReviewModal()">
                Agora não
            </button>
        </div>
    `;

    modal.classList.add('open');
    createOverlay();
}


async function submitPostPurchaseReview(productId) {
    const rating = parseInt(document.getElementById(`rating-${productId}`).value);
    const comment = document.getElementById(`comment-${productId}`).value.trim();

    if (!rating || !comment) {
        showMessage('Preencha a avaliação', 'warning');
        return;
    }

    try {
        await db.collection('productReviews').add({
            productId: productId,
            rating: rating,
            comment: comment,
            verifiedPurchase: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('⭐ Obrigado pela avaliação!', 'success');

        // Atualizar média
        await recalculateProductRating(productId);

        // Marcar como avaliado
        localStorage.removeItem('lastOrderCompleted');
        closePostPurchaseReviewModal();

    } catch (error) {
        console.error('Erro ao enviar avaliação:', error);
        showMessage('Erro ao enviar avaliação', 'error');
    }
}
function closePostPurchaseReviewModal() {
    const modal = document.getElementById('reviewAfterPurchaseModal');
    modal?.classList.remove('open');
    removeOverlay();
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkPendingReview();
    }
});

window.addEventListener('focus', () => {
    checkPendingReview();
});


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
// ===== DETALHES DO PRODUTO (MODAL + SEO + REVIEWS) =====
function showProductDetails(productId) {
    console.log('🔍 Mostrando detalhes do produto:', productId);

    const product = STATE.products.find(p => p.id === productId);

    if (!product) {
        console.error('❌ Produto não encontrado:', productId);
        showMessage('Produto não encontrado.', 'error');
        return;
    }

    // 🔥 REGISTRAR CLIQUE PARA ESTATÍSTICAS
    trackProductClick(productId, product.name);
    
    const category = STATE.categories.find(cat => cat.id === product.categoryId);
    const modal = document.getElementById('productModal');

    if (!modal) {
        console.error('❌ Modal de detalhes não encontrado');
        showMessage('Erro ao carregar detalhes do produto.', 'error');
        return;
    }

    // 🔥 SEO – Schema.org Product dinâmico
    injectProductSchema(product, category?.name);
    
    if (typeof gtag === 'function') {
        gtag('event', 'view_item', {
            currency: 'BRL',
            value: Number(product.price) || 0,
            items: [{
                item_id: product.id,
                item_name: product.name,
                price: Number(product.price) || 0,
                item_category: category?.name || 'Geral'
            }]
        });
    }
    
    modal.innerHTML = `
        <div class="modal-content product-modal-content" itemscope itemtype="https://schema.org/Product">

            <div class="modal-header">
                <h3 itemprop="name">${product.name}</h3>
                <button class="close-modal" onclick="closeProductModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body">
                <div class="product-detail-container">

                    <!-- IMAGEM -->
                    <div class="product-detail-image-section">
                        <img src="${product.imageURL || 'https://via.placeholder.com/400x400?text=Produto'}"
                             alt="${product.name}"
                             class="product-detail-image"
                             itemprop="image"
                             onerror="this.src='https://via.placeholder.com/400x400?text=Imagem+Não+Encontrada'">

                        <div class="product-detail-badges">
                            ${product.featured ? '<span class="badge featured-badge">⭐ Destaque</span>' : ''}
                            ${product.exclusive ? '<span class="badge exclusive-badge">🎯 Exclusivo</span>' : ''}
                            ${product.stock <= 0 ? '<span class="badge out-of-stock-badge">Esgotado</span>' : ''}
                        </div>
                    </div>

                    <!-- INFO -->
                    <div class="product-detail-info">

                        <h2 class="product-detail-title" itemprop="name">
                            ${product.name}
                        </h2>

                        <div class="product-detail-price"
                             itemprop="offers"
                             itemscope
                             itemtype="https://schema.org/Offer">
                            <meta itemprop="priceCurrency" content="BRL">
                            <span itemprop="price">R$ ${formatPrice(product.price)}</span>
                            <link itemprop="availability"
                                  href="https://schema.org/${product.stock > 0 ? 'InStock' : 'OutOfStock'}">
                        </div>

                        <!-- META -->
                        <div class="product-detail-meta">
                            <div class="meta-item">
                                <strong>Categoria:</strong>
                                <span itemprop="category">${category?.name || 'Geral'}</span>
                            </div>

                            ${product.subcategory ? `
                            <div class="meta-item">
                                <strong>Subcategoria:</strong>
                                <span>${product.subcategory}</span>
                            </div>` : ''}

                            <div class="meta-item">
                                <strong>Estoque:</strong>
                                <span class="${product.stock <= 0 ? 'out-of-stock' : 'in-stock'}">
                                    ${product.stock <= 0 ? 'Esgotado' : `${product.stock} unidades disponíveis`}
                                </span>
                            </div>
                            
                            <!-- 🔥 ESTATÍSTICAS DE CLIQUE -->
                            <div class="meta-item">
                                <strong>Visualizações:</strong>
                                <span id="productClickCount" class="click-count-badge">
                                    Carregando...
                                </span>
                            </div>
                        </div>

                        <!-- DESCRIÇÃO -->
                        ${product.description ? `
                        <div class="product-description-section" itemprop="description">
                            <h4><i class="fas fa-gem"></i> Detalhes da Joia</h4>
                            <div class="product-description-text jewelry-description">
                                ${formatJewelryDescription(product.description)}
                            </div>
                        </div>` : ''}

                        <!-- ⭐ AVALIAÇÕES -->
                        <div class="product-reviews-section">
                            <h4><i class="fas fa-star"></i> Avaliações dos Clientes</h4>

                            <div class="review-summary" itemprop="aggregateRating"
                                 itemscope itemtype="https://schema.org/AggregateRating">
                                <span class="review-average">
                                    ⭐ <span itemprop="ratingValue">
                                        ${product.rating?.average || '0.0'}
                                    </span>
                                </span>
                                <span class="review-count">
                                    (<span itemprop="reviewCount">
                                        ${product.rating?.count || 0}
                                    </span> avaliações)
                                </span>
                            </div>

                            <div id="productReviews"></div>

                            <div class="review-form">
                                <h5>💬 Deixe sua avaliação</h5>
                                <select id="reviewRating">
                                    <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                                    <option value="4">⭐⭐⭐⭐ Muito bom</option>
                                    <option value="3">⭐⭐⭐ Bom</option>
                                    <option value="2">⭐⭐ Regular</option>
                                    <option value="1">⭐ Ruim</option>
                                </select>

                                <textarea id="reviewComment"
                                    placeholder="Conte sua experiência com esta joia"></textarea>

                                <button class="btn-secondary"
                                    onclick="submitReview('${product.id}')">
                                    Enviar Avaliação
                                </button>
                            </div>
                        </div>

                        <!-- AÇÕES -->
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

    // Resetar quantidade
    STATE.detailQuantity = 1;

    // 🔥 Carregar avaliações reais
    loadProductReviews(product.id);
    
    // 🔥 Atualizar contador de cliques no modal
    updateClickCountInModal(productId);

    modal.classList.add('open');
    createOverlay();

    console.log('✅ Modal de detalhes aberto');
}

// ===== FUNÇÕES PARA RASTREAR CLIQUE DO PRODUTO =====

function trackProductClick(productId, productName) {
    try {
        console.log(`📊 Registrando clique no produto: ${productId} - ${productName}`);
        
        const timestamp = new Date().toISOString();
        
        // 1. Registrar no histórico completo de cliques
        const allClicks = JSON.parse(localStorage.getItem('productClicks') || '[]');
        allClicks.push({
            productId,
            productName,
            timestamp,
            date: timestamp.split('T')[0],
            hour: new Date().getHours(),
            source: 'product_details'
        });
        localStorage.setItem('productClicks', JSON.stringify(allClicks));
        
        // 2. Atualizar estatísticas do produto específico
        const productStats = JSON.parse(localStorage.getItem('productStats') || '{}');
        
        if (!productStats[productId]) {
            // Primeiro clique neste produto
            productStats[productId] = {
                productName,
                clickCount: 1,
                firstClick: timestamp,
                lastClick: timestamp,
                lastDate: timestamp.split('T')[0],
                viewsByDay: {
                    [timestamp.split('T')[0]]: 1
                }
            };
        } else {
            // Produto já clicado antes
            productStats[productId].clickCount = (productStats[productId].clickCount || 0) + 1;
            productStats[productId].lastClick = timestamp;
            productStats[productId].lastDate = timestamp.split('T')[0];
            
            // Atualizar contagem por dia
            const today = timestamp.split('T')[0];
            if (!productStats[productId].viewsByDay) {
                productStats[productId].viewsByDay = {};
            }
            productStats[productId].viewsByDay[today] = (productStats[productId].viewsByDay[today] || 0) + 1;
        }
        
        localStorage.setItem('productStats', JSON.stringify(productStats));
        
        console.log(`✅ Clique registrado: ${productStats[productId].clickCount} cliques`);
        
        // 3. Disparar evento personalizado para analytics (se necessário)
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('productClicked', {
                detail: { productId, productName, timestamp }
            }));
        }
        
    } catch (error) {
        console.error('❌ Erro ao registrar clique:', error);
    }
}

function updateClickCountInModal(productId) {
    try {
        const productStats = JSON.parse(localStorage.getItem('productStats') || '{}');
        const clickCount = productStats[productId]?.clickCount || 0;
        
        const clickCountElement = document.getElementById('productClickCount');
        if (clickCountElement) {
            clickCountElement.textContent = clickCount;
            clickCountElement.className = 'click-count-badge';
            
            // Adicionar classe baseada no número de cliques
            if (clickCount > 100) {
                clickCountElement.classList.add('high-views');
            } else if (clickCount > 50) {
                clickCountElement.classList.add('medium-views');
            } else {
                clickCountElement.classList.add('low-views');
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar contador de cliques:', error);
    }
}

// ===== ADICIONAR ESTILOS PARA O CONTADOR DE CLIQUE =====
function addClickCounterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .click-count-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .click-count-badge.low-views {
            background: #e3f2fd;
            color: #1976d2;
            border: 1px solid #bbdefb;
        }
        
        .click-count-badge.medium-views {
            background: #fff3e0;
            color: #f57c00;
            border: 1px solid #ffe0b2;
        }
        
        .click-count-badge.high-views {
            background: #fce4ec;
            color: #c2185b;
            border: 1px solid #f8bbd9;
        }
        
        /* Estilo para o item de meta */
        .product-detail-meta .meta-item:last-child {
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px dashed #e0e0e0;
        }
    `;
    
    // Adicionar estilos apenas se não existirem
    if (!document.querySelector('#clickCounterStyles')) {
        style.id = 'clickCounterStyles';
        document.head.appendChild(style);
    }
}

// ===== FUNÇÃO PARA RASTREAR CLIQUE EM BOTÕES "VER DETALHES" =====
function trackProductClicksGlobally() {
    // Esta função deve ser chamada quando a página carrega
    document.addEventListener('click', function(event) {
        // Verificar se o clique foi em um botão "Ver Detalhes"
        const detailsButton = event.target.closest('.details-btn, .btn-details, [onclick*="showProductDetails"]');
        
        if (detailsButton) {
            // Extrair o productId do onclick ou data attribute
            const onclickAttr = detailsButton.getAttribute('onclick') || '';
            const match = onclickAttr.match(/showProductDetails\s*\(\s*['"]([^'"]+)['"]\s*\)/);
            
            if (match && match[1]) {
                const productId = match[1];
                const productName = detailsButton.getAttribute('data-product-name') || 
                                   detailsButton.closest('.product-card')?.querySelector('.product-title')?.textContent || 
                                   'Produto';
                
                // Registrar clique imediatamente
                setTimeout(() => {
                    trackProductClick(productId, productName.trim());
                }, 100); // Pequeno delay para garantir que o modal abra
            }
        }
    });
}

// ===== INICIALIZAR RASTREAMENTO =====
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estilos para o contador
    addClickCounterStyles();
    
    // Iniciar rastreamento global de cliques
    trackProductClicksGlobally();
    
    console.log('📊 Sistema de rastreamento de produtos inicializado');
});

// ===== FUNÇÃO PARA VERIFICAR ESTATÍSTICAS (DEBUG) =====
function debugProductStats(productId) {
    const productStats = JSON.parse(localStorage.getItem('productStats') || '{}');
    const allClicks = JSON.parse(localStorage.getItem('productClicks') || '[]');
    
    console.log('=== DEBUG ESTATÍSTICAS ===');
    console.log('Total de cliques registrados:', allClicks.length);
    console.log('Produtos com estatísticas:', Object.keys(productStats).length);
    console.log('Estatísticas do produto', productId, ':', productStats[productId]);
    console.log('Cliques hoje:', allClicks.filter(c => c.date === new Date().toISOString().split('T')[0]).length);
}
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('open');
        modal.innerHTML = '';
        removeOverlay?.();
    }
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
}// ===== FORMATADOR SEO AVANÇADO PARA DESCRIÇÃO DE JOIAS =====
function formatJewelryDescription(description) {
    if (!description) return '';

    let formatted = description.trim();

    /* 1. Normalizar quebras de linha */
    formatted = formatted.replace(/\r\n|\r/g, '\n');

    /* 2. Detectar listas ( *, -, •, ✓ ) */
    formatted = formatted.replace(
        /(?:^|\n)([\*\-\•\✓])\s+(.+)/g,
        '<li itemprop="additionalProperty">$2</li>'
    );

    /* 3. Separar blocos */
    const blocks = formatted.split(/\n{2,}/);

    formatted = blocks.map(block => {

        /* Se for lista */
        if (block.includes('<li')) {
            return `
                <ul class="jewelry-features-list" role="list">
                    ${block}
                </ul>
            `;
        }

        /* Se for título [Ex: [Detalhes]] */
        if (block.match(/^\[.*?\]$/)) {
            const title = block.replace(/[\[\]]/g, '');
            return `<h4 class="jewelry-subtitle">${title}</h4>`;
        }

        /* Parágrafo padrão */
        return `
            <p class="jewelry-paragraph" itemprop="description">
                ${block}
            </p>
        `;
    }).join('');

    /* 4. Destaque técnico (SEO semântico) */
    const techTerms = [
        'ouro 18k', 'ouro', 'prata 925', 'prata',
        'quilate', 'ct', 'gramas', 'g', 'cm', 'mm',
        'zircônia', 'diamante', 'pérola',
        'aço 316l', 'pvd', 'banho de ouro'
    ];

    techTerms.forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        formatted = formatted.replace(
            regex,
            `<strong class="tech-term">$1</strong>`
        );
    });

    /* 5. Emojis leves e estratégicos (UX + CTR) */
    const emojiMap = {
        'brilho|brilhante': '✨',
        'luxo|luxuoso|sofisticado': '👑',
        'presente|presentear': '🎁',
        'exclusivo|limitado': '⭐',
        'garantia|certificado': '🏅',
        'frete grátis|entrega grátis': '🚚'
    };

    Object.entries(emojiMap).forEach(([pattern, emoji]) => {
        const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
        formatted = formatted.replace(regex, `${emoji} $1`);
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

// ===== ADICIONAR AO CARRINHO (MODAL) – VERSÃO COM RECOMENDAÇÕES =====
function addToCartFromDetail(productId) {
    try {
        console.log('🛒 Iniciando adição ao carrinho:', productId);
        
        // 1. OBTER ELEMENTOS DA UI
        const quantityInput = document.getElementById('detailQuantity');
        const addButton = document.querySelector('.btn-primary[onclick*="addToCartFromDetail"]');
        
        // 2. DESABILITAR BOTÃO PARA EVITAR CLICKS DUPLICADOS
        if (addButton) {
            addButton.disabled = true;
            addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adicionando...';
        }
        
        // 3. VALIDAR QUANTIDADE
        let quantity = 1;
        if (quantityInput) {
            quantity = parseInt(quantityInput.value, 10);
            
            if (isNaN(quantity) || quantity < 1) {
                throw new Error('Quantidade inválida');
            }
            
            // Limitar quantidade máxima
            quantity = Math.min(quantity, 99);
        }
        
        // 4. BUSCAR PRODUTO
        const product = STATE.products.find(p => p.id === productId);
        if (!product) {
            throw new Error('Produto não encontrado');
        }
        
        // 5. VALIDAR ESTOQUE
        if (product.stock <= 0) {
            showMessage(`⏳ ${product.name} está esgotado.`, 'warning');
            
            // Mostrar produtos similares como alternativa
            setTimeout(() => {
                showSimilarProducts(productId);
            }, 800);
            
            // Oferecer opção de lista de espera
            setTimeout(() => {
                if (confirm(`Deseja ser avisado quando ${product.name} estiver disponível novamente?`)) {
                    addToWaitlist(productId);
                }
            }, 500);
            
            if (addButton) {
                addButton.disabled = false;
                addButton.innerHTML = '<i class="fas fa-times"></i> Esgotado';
            }
            return;
        }
        
        if (quantity > product.stock) {
            showMessage(`⚠️ Estoque insuficiente! Apenas ${product.stock} unidade(s) disponível(is).`, 'warning');
            
            // Oferecer ajuste automático
            if (confirm(`Ajustar quantidade para ${product.stock} (máximo disponível)?`)) {
                if (quantityInput) {
                    quantityInput.value = product.stock;
                    quantity = product.stock;
                } else {
                    return;
                }
            } else {
                if (addButton) {
                    addButton.disabled = false;
                    addButton.innerHTML = '<i class="fas fa-shopping-bag"></i> Adicionar ao Carrinho';
                }
                return;
            }
        }
        
        // 6. ATUALIZAR CARRINHO
        const existingItemIndex = STATE.cart.findIndex(item => item.id === productId);
        let isNewItem = false;
        
        if (existingItemIndex !== -1) {
            // Produto já está no carrinho
            const item = STATE.cart[existingItemIndex];
            const newQty = item.quantity + quantity;
            
           
            
            // Atualizar quantidade
            STATE.cart[existingItemIndex].quantity = newQty;
            STATE.cart[existingItemIndex].updatedAt = new Date().toISOString();
            
            // Registrar no histórico
            registerCartAddition(product, quantity);
            
            console.log(`🔄 Atualizado: ${product.name} (${newQty} unidades)`);
            
        } else {
            // Novo item no carrinho
            const cartItem = {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price) || 0,
                imageURL: product.imageURL || 'https://via.placeholder.com/300x300/667eea/ffffff?text=Quero%27Luxo',
                quantity: quantity,
                stock: product.stock || 0,
                category: product.categoryId || 'geral',
                addedAt: new Date().toISOString(),
                cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            STATE.cart.push(cartItem);
            isNewItem = true;
            
            // Registrar no histórico
            registerCartAddition(product, quantity);
            
            console.log(`✅ Adicionado: ${product.name} (${quantity} unidades)`);
        }
        
        // Salvar carrinho no localStorage
        localStorage.setItem('shoppingCart', JSON.stringify(STATE.cart));
        
        // Atualizar estatísticas
        updateProductStats(product.id, 'add_to_cart', quantity);
        
        // 7. ANIMAÇÕES E FEEDBACK VISUAL
        playAddToCartAnimation();
        updateCartBadge();
        
        // 8. NOTIFICAÇÃO DE SUCESSO (versão simplificada)
        showCartSuccessMessage(product, quantity);
        
        // 9. RASTREAMENTO
        trackCartEvent(product, quantity);
        
        // 10. MOSTRAR RECOMENDAÇÕES DE PRODUTOS
        if (isNewItem) {
            setTimeout(() => {
                showProductRecommendations(productId);
            }, 1200);
        }
        
        // 11. AÇÕES PÓS-ADIÇÃO
        setTimeout(() => {
            postAddToCartActions(productId, quantity);
        }, 800);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar ao carrinho:', error);
        showMessage(`❌ Erro: ${error.message}`, 'error');
    } finally {
        // 12. RESTAURAR BOTÃO
        setTimeout(() => {
            restoreAddButton();
        }, 1000);
    }
}

// ===== FUNÇÃO POST ADD TO CART ACTIONS ATUALIZADA =====
function postAddToCartActions(productId, quantity) {
    // 1. Atualizar estoque local
    updateLocalStock(productId, quantity);
    
    // 2. Verificar se deve fechar o modal
    const shouldClose = checkShouldCloseModal();
    if (shouldClose) {
        setTimeout(() => {
            closeProductModal();
            
            // Mostrar preview do carrinho se tiver poucos itens
            if (STATE.cart.length <= 3) {
                setTimeout(() => {
                    showCartPreview();
                }, 500);
            }
        }, 2000);
    }
}

// ===== FUNÇÃO showCartSuccessMessage ATUALIZADA =====
function showCartSuccessMessage(product, quantity) {
    const totalPrice = (parseFloat(product.price) || 0) * quantity;
    const formattedPrice = formatPrice(totalPrice);
    
    // Criar notificação com opções
    const notification = document.createElement('div');
    notification.className = 'cart-success-message';
    notification.innerHTML = `
        <div class="message-content">
            <div class="message-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="message-body">
                <h4>✅ Adicionado ao Carrinho!</h4>
                <p><strong>${quantity > 1 ? quantity + 'x ' : ''}${product.name}</strong></p>
                <p class="message-sub">Total: R$ ${formattedPrice}</p>
                <div class="message-extra">
                    <small><i class="fas fa-shipping-fast"></i> Entrega em 3-7 dias úteis</small>
                    <small><i class="fas fa-shield-alt"></i> Compra 100% segura</small>
                </div>
            </div>
            <div class="message-actions">
                <button onclick="continueShoppingFromModal()" class="btn-continue-shopping">
                    <i class="fas fa-arrow-left"></i> Continuar
                </button>
                <button onclick="viewCartFromModal()" class="btn-view-cart-modal">
                    <i class="fas fa-shopping-cart"></i> Ver Carrinho
                </button>
                <button onclick="closeCartNotification()" class="btn-close-message">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    // Adicionar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        z-index: 99999;
        animation: slideInRight 0.4s ease;
        border-left: 4px solid #28a745;
        max-width: 450px;
        overflow: hidden;
    `;
    
    // Adicionar keyframes se não existirem
    if (!document.querySelector('#modal-notification-keyframes')) {
        const style = document.createElement('style');
        style.id = 'modal-notification-keyframes';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Estilos para o conteúdo
    const messageContent = notification.querySelector('.message-content');
    messageContent.style.cssText = `
        padding: 20px;
    `;
    
    notification.querySelector('.message-icon').style.cssText = `
        font-size: 2.5rem;
        color: #28a745;
        margin-bottom: 15px;
        text-align: center;
    `;
    
    notification.querySelector('.message-body h4').style.cssText = `
        margin: 0 0 10px 0;
        color: #333;
        font-size: 1.2rem;
        text-align: center;
    `;
    
    notification.querySelector('.message-body p').style.cssText = `
        margin: 5px 0;
        color: #666;
        text-align: center;
    `;
    
    notification.querySelector('.message-sub').style.cssText = `
        color: #28a745;
        font-weight: 600;
        font-size: 1.1rem;
        margin: 10px 0 15px 0 !important;
    `;
    
    notification.querySelector('.message-extra').style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin: 15px 0;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
    `;
    
    notification.querySelector('.message-extra small').style.cssText = `
        color: #6c757d;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    notification.querySelector('.message-actions').style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr 40px;
        gap: 10px;
        margin-top: 20px;
    `;
    
    // Botões estilizados
    const buttons = notification.querySelectorAll('.message-actions button');
    buttons.forEach(btn => {
        btn.style.cssText = `
            padding: 10px;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s;
        `;
        
        if (btn.classList.contains('btn-continue-shopping')) {
            btn.style.background = '#6c757d';
            btn.style.color = 'white';
            btn.onmouseover = () => btn.style.background = '#545b62';
            btn.onmouseout = () => btn.style.background = '#6c757d';
        } else if (btn.classList.contains('btn-view-cart-modal')) {
            btn.style.background = '#667eea';
            btn.style.color = 'white';
            btn.onmouseover = () => btn.style.background = '#5a67d8';
            btn.onmouseout = () => btn.style.background = '#667eea';
        } else if (btn.classList.contains('btn-close-message')) {
            btn.style.background = '#f8f9fa';
            btn.style.color = '#6c757d';
            btn.onmouseover = () => {
                btn.style.background = '#e9ecef';
                btn.style.color = '#495057';
            };
            btn.onmouseout = () => {
                btn.style.background = '#f8f9fa';
                btn.style.color = '#6c757d';
            };
        }
    });
    
    // Funções dos botões
    notification.querySelector('.btn-continue-shopping').onclick = function() {
        // Fechar notificação e continuar no modal
        if (notification.parentNode) {
            notification.remove();
        }
    };
    
    notification.querySelector('.btn-view-cart-modal').onclick = function() {
        window.location.href = 'carrinho.html';
    };
    
    notification.querySelector('.btn-close-message').onclick = function() {
        if (notification.parentNode) {
            notification.remove();
        }
    };
    
    // Remover notificações anteriores
    const existingNotifications = document.querySelectorAll('.cart-success-message');
    existingNotifications.forEach(n => n.remove());
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Auto-remover após 8 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }
    }, 8000);
}

// ===== FUNÇÕES AUXILIARES PARA O MODAL =====
function continueShoppingFromModal() {
    // Fechar notificações
    document.querySelectorAll('.cart-success-message').forEach(n => n.remove());
    // O modal permanece aberto para continuar comprando
}

function viewCartFromModal() {
    // Fechar modal primeiro
    closeProductModal();
    // Redirecionar para o carrinho
    setTimeout(() => {
        window.location.href = 'carrinho.html';
    }, 300);
}

function closeCartNotification() {
    document.querySelectorAll('.cart-success-message').forEach(n => n.remove());
}

// ===== FUNÇÃO PARA MOSTRAR PREVIEW DO CARRINHO =====
function showCartPreview() {
    try {
        if (STATE.cart.length === 0) return;
        
        const totalItems = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = STATE.cart.reduce((sum, item) => 
            sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
        
        const preview = document.createElement('div');
        preview.className = 'cart-preview-notification';
        preview.innerHTML = `
            <div class="preview-header">
                <h5><i class="fas fa-shopping-cart"></i> Seu Carrinho (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})</h5>
                <button class="close-preview" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="preview-items">
                ${STATE.cart.slice(0, 3).map(item => `
                    <div class="preview-item">
                        <img src="${item.imageURL || 'https://via.placeholder.com/40x40'}" 
                             alt="${item.name}"
                             class="preview-image">
                        <div class="preview-info">
                            <span class="preview-name">${item.name}</span>
                            <span class="preview-quantity">${item.quantity}x</span>
                        </div>
                        <span class="preview-price">R$ ${formatPrice(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="preview-total">
                <span>Total:</span>
                <span class="preview-total-value">R$ ${formatPrice(totalValue)}</span>
            </div>
            <div class="preview-actions">
                <button onclick="viewCart()" class="btn-preview-cart">
                    <i class="fas fa-shopping-cart"></i> Ver Carrinho
                </button>
                <button onclick="checkout()" class="btn-preview-checkout">
                    <i class="fas fa-lock"></i> Finalizar Compra
                </button>
            </div>
        `;
        
        // Estilos para o preview
        preview.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            z-index: 9998;
            animation: slideInUp 0.5s ease;
            max-width: 350px;
            border: 1px solid #e0e0e0;
            overflow: hidden;
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(preview);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (preview.parentNode) {
                preview.remove();
            }
        }, 10000);
        
    } catch (error) {
        console.error('❌ Erro ao mostrar preview do carrinho:', error);
    }
}

// ===== FUNÇÃO checkShouldCloseModal =====
function checkShouldCloseModal() {
    // Verificar preferências do usuário
    const userPref = localStorage.getItem('cartModalPreference');
    if (userPref === 'keep_open') return false;
    
    // Verificar se há muitos itens no carrinho
    if (STATE.cart.length >= 5) return true;
    
    // Verificar valor total
    const totalValue = STATE.cart.reduce((sum, item) => 
        sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
    if (totalValue > 500) return true;
    
    // Padrão: não fechar automaticamente quando vem do modal
    return false;
}

// ===== FUNÇÃO registerCartAddition (adicione esta função) =====
function registerCartAddition(product, quantity) {
    try {
        console.log('📝 Registrando adição ao carrinho no histórico:', product.name, quantity);
        
        // 1. Obter ou criar histórico
        let cartHistory = JSON.parse(localStorage.getItem('cartHistory') || '[]');
        
        // 2. Criar registro da adição
        const additionRecord = {
            action: 'add',
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: parseFloat(product.price) || 0,
            total: (parseFloat(product.price) || 0) * quantity,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0], // Data separada para facilitar filtros
            hour: new Date().getHours(),
            sessionId: localStorage.getItem('sessionId') || 'unknown'
        };
        
        // 3. Adicionar ao histórico
        cartHistory.push(additionRecord);
        
        // 4. Limitar histórico aos últimos 100 registros
        if (cartHistory.length > 100) {
            cartHistory = cartHistory.slice(-100);
        }
        
        // 5. Salvar no localStorage
        localStorage.setItem('cartHistory', JSON.stringify(cartHistory));
        
        console.log('✅ Adição registrada no histórico:', additionRecord);
        
        // 6. Atualizar estatísticas de conversão
        updateConversionStats(product.id, quantity);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao registrar adição ao carrinho:', error);
        return false;
    }
}

// ===== FUNÇÃO updateConversionStats (adicione esta função) =====
function updateConversionStats(productId, quantity) {
    try {
        // Obter estatísticas de conversão
        let conversionStats = JSON.parse(localStorage.getItem('conversionStats') || '{}');
        
        // Obter data atual
        const today = new Date().toISOString().split('T')[0];
        
        // Inicializar ou atualizar estatísticas do produto
        if (!conversionStats[productId]) {
            conversionStats[productId] = {
                productId: productId,
                addToCartCount: 0,
                purchases: 0,
                todayAdditions: 0,
                totalQuantity: 0,
                lastAdded: null,
                firstAdded: new Date().toISOString(),
                dailyStats: {}
            };
        }
        
        // Atualizar contadores
        conversionStats[productId].addToCartCount = (conversionStats[productId].addToCartCount || 0) + 1;
        conversionStats[productId].totalQuantity = (conversionStats[productId].totalQuantity || 0) + quantity;
        conversionStats[productId].lastAdded = new Date().toISOString();
        
        // Atualizar estatísticas diárias
        if (!conversionStats[productId].dailyStats[today]) {
            conversionStats[productId].dailyStats[today] = {
                date: today,
                additions: 0,
                quantity: 0
            };
        }
        
        conversionStats[productId].dailyStats[today].additions = 
            (conversionStats[productId].dailyStats[today].additions || 0) + 1;
        conversionStats[productId].dailyStats[today].quantity = 
            (conversionStats[productId].dailyStats[today].quantity || 0) + quantity;
        
        // Atualizar contador de adições de hoje
        conversionStats[productId].todayAdditions = conversionStats[productId].dailyStats[today].additions || 0;
        
        // Salvar estatísticas
        localStorage.setItem('conversionStats', JSON.stringify(conversionStats));
        
        console.log('📊 Estatísticas de conversão atualizadas para produto:', productId);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar estatísticas de conversão:', error);
    }
}

// ===== FUNÇÃO updateProductStats (se não existir) =====
function updateProductStats(productId, action, quantity = 1) {
    try {
        const stats = JSON.parse(localStorage.getItem('productStats') || '{}');
        
        if (!stats[productId]) {
            const product = STATE.products.find(p => p.id === productId);
            stats[productId] = {
                productName: product?.name || 'Produto',
                clickCount: 0,
                addToCartCount: 0,
                totalQuantity: 0,
                lastAdded: null
            };
        }
        
        if (action === 'add_to_cart') {
            stats[productId].addToCartCount = (stats[productId].addToCartCount || 0) + 1;
            stats[productId].totalQuantity = (stats[productId].totalQuantity || 0) + quantity;
            stats[productId].lastAdded = new Date().toISOString();
        }
        
        localStorage.setItem('productStats', JSON.stringify(stats));
        
    } catch (error) {
        console.error('❌ Erro ao atualizar estatísticas do produto:', error);
    }
}

// ===== FUNÇÃO playAddToCartAnimation (se não existir) =====
function playAddToCartAnimation() {
    // Animação do ícone do carrinho
    const cartIcon = document.querySelector('.cart-icon, .cart-button');
    if (cartIcon) {
        cartIcon.classList.add('cart-pulse');
        setTimeout(() => {
            cartIcon.classList.remove('cart-pulse');
        }, 600);
    }
}

// ===== FUNÇÃO updateCartBadge (se não existir) =====
function updateCartBadge() {
    const totalItems = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-count, .cart-badge');
    
    if (badge) {
        // Atualizar contador
        badge.textContent = totalItems > 99 ? '99+' : totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
        
        // Animação
        badge.classList.add('badge-bounce');
        setTimeout(() => {
            badge.classList.remove('badge-bounce');
        }, 300);
    }
}

// ===== FUNÇÃO restoreAddButton (se não existir) =====
function restoreAddButton() {
    const addButton = document.querySelector('.btn-primary[onclick*="addToCartFromDetail"]');
    if (addButton) {
        addButton.disabled = false;
        addButton.innerHTML = '<i class="fas fa-shopping-bag"></i> Adicionar ao Carrinho';
    }
}
// ===== FUNÇÕES AUXILIARES CORRIGIDAS =====

function updateCartWithProduct(product, quantity) {
    const existingItemIndex = STATE.cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
        // Atualizar item existente
        const newQuantity = STATE.cart[existingItemIndex].quantity + quantity;
        
    
        
        STATE.cart[existingItemIndex].quantity = newQuantity;
        STATE.cart[existingItemIndex].updatedAt = new Date().toISOString();
        
        console.log(`🔄 Atualizado: ${product.name} (${newQuantity} unidades)`);
        
    } else {
        // Adicionar novo item
        const cartItem = {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price) || 0,
            imageURL: product.imageURL || getDefaultProductImage(),
            quantity: quantity,
            stock: product.stock || 0,
            category: product.categoryId || 'geral',
            addedAt: new Date().toISOString(),
            cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        STATE.cart.push(cartItem);
        console.log(`✅ Adicionado: ${product.name} (${quantity} unidades)`);
    }
    
    // Atualizar localStorage
    localStorage.setItem('shoppingCart', JSON.stringify(STATE.cart));
    
    // Atualizar contador de estatísticas
    updateProductStats(product.id, 'add_to_cart', quantity);
}



function showCartSuccessMessage(product, quantity) {
    const totalPrice = (parseFloat(product.price) || 0) * quantity;
    const formattedPrice = formatPrice(totalPrice);
    
    // Criar notificação simples
    const notification = document.createElement('div');
    notification.className = 'cart-success-message';
    notification.innerHTML = `
        <div class="message-content">
            <div class="message-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="message-body">
                <h4>✅ Adicionado ao Carrinho!</h4>
                <p><strong>${quantity > 1 ? quantity + 'x ' : ''}${product.name}</strong></p>
                <p class="message-sub">Total: R$ ${formattedPrice}</p>
            </div>
            <div class="message-actions">
                <button onclick="viewCart()" class="btn-view-cart-small">
                    <i class="fas fa-shopping-cart"></i> Ver Carrinho
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-close-message">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    // Estilos inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        z-index: 99999;
        animation: slideInRight 0.4s ease;
        border-left: 4px solid #28a745;
        max-width: 400px;
        overflow: hidden;
    `;
    
    // Adicionar keyframes se não existirem
    if (!document.querySelector('#cart-animation-keyframes')) {
        const style = document.createElement('style');
        style.id = 'cart-animation-keyframes';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            @keyframes cartPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            @keyframes badgeBounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
            .cart-pulse {
                animation: cartPulse 0.6s ease;
            }
            .badge-bounce {
                animation: badgeBounce 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Estilos para o conteúdo
    notification.querySelector('.message-content').style.cssText = `
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 16px;
    `;
    
    notification.querySelector('.message-icon').style.cssText = `
        font-size: 2rem;
        color: #28a745;
    `;
    
    notification.querySelector('.message-body').style.cssText = `
        flex: 1;
    `;
    
    notification.querySelector('.message-body h4').style.cssText = `
        margin: 0 0 8px 0;
        color: #333;
        font-size: 1.1rem;
    `;
    
    notification.querySelector('.message-body p').style.cssText = `
        margin: 4px 0;
        color: #666;
    `;
    
    notification.querySelector('.message-sub').style.cssText = `
        color: #28a745;
        font-weight: 600;
        font-size: 0.9rem;
    `;
    
    notification.querySelector('.message-actions').style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;
    
    notification.querySelector('.btn-view-cart-small').style.cssText = `
        background: #667eea;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.3s;
        display: flex;
        align-items: center;
        gap: 6px;
    `;
    
    notification.querySelector('.btn-view-cart-small').onmouseover = function() {
        this.style.background = '#5a67d8';
    };
    
    notification.querySelector('.btn-view-cart-small').onmouseout = function() {
        this.style.background = '#667eea';
    };
    
    notification.querySelector('.btn-close-message').style.cssText = `
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 1rem;
        padding: 4px;
        border-radius: 50%;
        transition: all 0.3s;
    `;
    
    notification.querySelector('.btn-close-message').onmouseover = function() {
        this.style.background = '#f5f5f5';
        this.style.color = '#666';
    };
    
    // Remover notificações anteriores
    const existingNotifications = document.querySelectorAll('.cart-success-message');
    existingNotifications.forEach(n => n.remove());
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }
    }, 5000);
    
    // Atualizar UI do carrinho
    updateCartUI();
}

function trackCartEvent(product, quantity) {
    try {
        // Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', 'add_to_cart', {
                currency: 'BRL',
                value: parseFloat(product.price) * quantity,
                items: [{
                    item_id: product.id,
                    item_name: product.name,
                    price: parseFloat(product.price),
                    quantity: quantity
                }]
            });
        }
        
        // Evento personalizado
        const cartEvent = new CustomEvent('cart:itemAdded', {
            detail: {
                productId: product.id,
                productName: product.name,
                quantity: quantity,
                price: parseFloat(product.price),
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(cartEvent);
        
        // Registrar no histórico
        const history = JSON.parse(localStorage.getItem('cartHistory') || '[]');
        history.push({
            action: 'add',
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: parseFloat(product.price),
            timestamp: new Date().toISOString()
        });
        
        // Manter apenas últimos 50 registros
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        localStorage.setItem('cartHistory', JSON.stringify(history));
        
    } catch (error) {
        console.error('Erro no rastreamento:', error);
    }
}

function postAddToCartActions(productId, quantity) {
    // 1. Atualizar estoque local
    updateLocalStock(productId, quantity);
    
    // 2. Mostrar produtos relacionados (se for o primeiro item)
    if (STATE.cart.reduce((sum, item) => sum + item.quantity, 0) === quantity) {
        setTimeout(() => {
            showRelatedProducts(productId);
        }, 1200);
    }
    
    // 3. Fechar modal após 1.5 segundos
    setTimeout(() => {
        closeProductModal();
        
        // Mostrar preview do carrinho se tiver poucos itens
        if (STATE.cart.length <= 3) {
            setTimeout(() => {
                showMiniCartPreview();
            }, 300);
        }
    }, 1500);
}



// ===== FUNÇÕES DE UTILIDADE =====

function getDefaultProductImage() {
    return 'https://via.placeholder.com/300x300/667eea/ffffff?text=Quero%27Luxo';
}

function formatPrice(price) {
    const num = parseFloat(price) || 0;
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateLocalStock(productId, quantity) {
    const productIndex = STATE.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        STATE.products[productIndex].stock = Math.max(
            0,
            STATE.products[productIndex].stock - quantity
        );
        
        // Atualizar UI se estiver visível
        const stockElement = document.querySelector('.product-detail-meta .in-stock');
        if (stockElement && STATE.products[productIndex].stock > 0) {
            stockElement.textContent = `${STATE.products[productIndex].stock} unidades disponíveis`;
        }
    }
}

function addToWaitlist(productId) {
    const waitlist = JSON.parse(localStorage.getItem('productWaitlist') || '[]');
    
    if (!waitlist.includes(productId)) {
        waitlist.push(productId);
        localStorage.setItem('productWaitlist', JSON.stringify(waitlist));
        
        showMessage('✅ Você será notificado quando o produto estiver disponível!', 'success');
    }
}

function viewCart() {
    window.location.href = 'carrinho.html';
}

function showRelatedProducts(productId) {
    const product = STATE.products.find(p => p.id === productId);
    if (!product) return;
    
    // Buscar produtos da mesma categoria
    const relatedProducts = STATE.products.filter(p => 
        p.id !== productId && 
        p.categoryId === product.categoryId &&
        p.stock > 0
    ).slice(0, 3);
    
    if (relatedProducts.length > 0) {
        // Aqui você pode implementar um modal de produtos relacionados
        console.log('Produtos relacionados:', relatedProducts.map(p => p.name));
    }
}

function showMiniCartPreview() {
    // Aqui você pode implementar um preview do carrinho
    const totalItems = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        showMessage(`🛒 Você tem ${totalItems} ${totalItems === 1 ? 'item' : 'itens'} no carrinho.`, 'info');
    }
}

// ===== FUNÇÃO showMessage (caso não exista) =====
if (typeof showMessage !== 'function') {
    function showMessage(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            background: ${type === 'success' ? '#28a745' : 
                        type === 'error' ? '#dc3545' : 
                        type === 'warning' ? '#ffc107' : 
                        type === 'info' ? '#17a2b8' : '#6c757d'};
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
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

// Funções de loading melhoradas
function showLoading() {
    const container = document.getElementById('selectedCategoryProducts');
    if (!container) return;
    
    // Apenas mostrar loading na primeira página
    if (STATE.pagination.currentPage === 1) {
        container.innerHTML = `
            <div class="loading-container" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid #f3f3f3;
                    border-top: 3px solid #667eea; border-radius: 50%; margin: 0 auto 20px;
                    animation: spin 1s linear infinite;"></div>
                <p style="color: #666;">Carregando produtos...</p>
            </div>
        `;
    }
}

function hideLoading() {
    // Remove qualquer elemento de loading
    const loadingElements = document.querySelectorAll('.loading-container, .loading-spinner');
    loadingElements.forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}


document.head.appendChild(style);

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

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .fa-spin {
        animation: fa-spin 1s linear infinite;
    }
    
    @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);


function addToCart(productId) {
    try {
        console.log('🛒 Adicionando produto ao carrinho:', productId);
        
        // Encontrar o produto na lista de produtos
        const product = STATE.products.find(p => p.id === productId);
        
        if (!product) {
            console.error('❌ Produto não encontrado:', productId);
            showMessage('Produto não encontrado.', 'error');
            return;
        }

       

        // Verificar se o produto já está no carrinho
        const existingItemIndex = STATE.cart.findIndex(item => item.id === productId);
        let isNewItem = false;
        
        if (existingItemIndex !== -1) {
            // Produto já está no carrinho
            const existingItem = STATE.cart[existingItemIndex];
            
            // Verificar se não excede o estoque disponível
            if (existingItem.quantity >= product.stock) {
                console.log('📦 Quantidade máxima em estoque atingida:', product.name);
                showMessage('Quantidade máxima em estoque atingida.', 'warning');
                return;
            }
            
            // Incrementar quantidade NO CARRINHO apenas
            existingItem.quantity++;
            existingItem.updatedAt = new Date().toISOString();
            
            console.log('➕ Quantidade incrementada no carrinho:', product.name, 
                       'Quantidade no carrinho:', existingItem.quantity, 
                       'Estoque disponível:', product.stock);
            
        } else {
            // Adicionar novo item ao carrinho
            const cartItem = {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price) || 0,
                imageURL: product.imageURL,
                stock: product.stock,
                quantity: 1,
                category: product.categoryId || 'geral',
                addedAt: new Date().toISOString(),
                cartId: generateId()
            };
            
            STATE.cart.push(cartItem);
            isNewItem = true;
            
            console.log('🆕 Novo produto adicionado ao carrinho:', product.name, 
                       'Estoque disponível:', product.stock);
        }

        // Registrar no histórico
        registerCartAddition(product, 1);
        
        // Atualizar interface do carrinho
        updateCartUI();
        
        // Atualizar badge do carrinho
        updateCartBadge();
        
        // Mostrar animação
        playAddToCartAnimation();
        
        // Mostrar mensagem de sucesso
        showCartSuccessMessage(product, 1);

        // 📊 Google Analytics – Add to Cart
        if (typeof gtag === 'function') {
            gtag('event', 'add_to_cart', {
                currency: 'BRL',
                value: Number(product.price) || 0,
                items: [{
                    item_id: product.id,
                    item_name: product.name,
                    price: Number(product.price) || 0,
                    quantity: 1
                }]
            });
        }

        // Salvar carrinho no localStorage
        localStorage.setItem('shoppingCart', JSON.stringify(STATE.cart));
        
        // Atualizar estatísticas
        updateProductStats(product.id, 'add_to_cart', 1);
        
        // MOSTRAR RECOMENDAÇÕES DE PRODUTOS
        if (isNewItem) {
            setTimeout(() => {
                showProductRecommendations(productId);
            }, 1200);
        }
        
        // Abrir carrinho automaticamente (opcional)
        if (!STATE.isCartOpen) {
            toggleCart();
        }
        
    } catch (error) {
        console.error('❌ Erro ao adicionar ao carrinho:', error);
        showMessage('Erro ao adicionar produto ao carrinho.', 'error');
    }
}

// ===== FUNÇÃO PARA MOSTRAR RECOMENDAÇÕES DE PRODUTOS =====
function showProductRecommendations(productId) {
    try {
        console.log('✨ Mostrando recomendações para produto:', productId);
        
        const product = STATE.products.find(p => p.id === productId);
        if (!product) return;
        
        // Buscar produtos recomendados
        const recommendedProducts = getRecommendedProducts(productId);
        
        if (recommendedProducts.length === 0) return;
        
        // Criar modal de recomendações
        const recommendationModal = document.createElement('div');
        recommendationModal.className = 'recommendation-modal';
        recommendationModal.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideInUp 0.5s ease;
            max-width: 400px;
            border: 1px solid #e0e0e0;
            overflow: hidden;
        `;
        
        recommendationModal.innerHTML = `
            <div class="recommendation-header">
                <h4><i class="fas fa-star"></i> Complete seu Look!</h4>
                <p>Clientes que compraram "${product.name}" também adoraram:</p>
                <button class="close-recommendations" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="recommendation-grid">
                ${recommendedProducts.map(rec => `
                    <div class="recommendation-item">
                        <img src="${rec.imageURL || 'https://via.placeholder.com/80x80?text=Produto'}" 
                             alt="${rec.name}"
                             class="recommendation-image"
                             onerror="this.src='https://via.placeholder.com/80x80?text=Produto'">
                        <div class="recommendation-info">
                            <h5 class="recommendation-title">${rec.name}</h5>
                            <p class="recommendation-price">R$ ${formatPrice(rec.price)}</p>
                            <button class="btn-recommendation-add" onclick="addRecommendedToCart('${rec.id}')">
                                <i class="fas fa-plus"></i> Adicionar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="recommendation-footer">
                <button class="btn-close-all" onclick="this.parentElement.parentElement.remove()">
                    Continuar comprando
                </button>
            </div>
        `;
        
        // Adicionar estilos
        if (!document.querySelector('#recommendation-styles')) {
            const style = document.createElement('style');
            style.id = 'recommendation-styles';
            style.textContent = `
                @keyframes slideInUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .recommendation-header {
                    padding: 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    position: relative;
                }
                
                .recommendation-header h4 {
                    margin: 0 0 8px 0;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .recommendation-header p {
                    margin: 0;
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                
                .close-recommendations {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.3s;
                }
                
                .close-recommendations:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .recommendation-grid {
                    padding: 16px;
                    max-height: 300px;
                    overflow-y: auto;
                }
                
                .recommendation-item {
                    display: flex;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 8px;
                    transition: background 0.3s;
                    margin-bottom: 12px;
                }
                
                .recommendation-item:hover {
                    background: #f8f9fa;
                }
                
                .recommendation-item:last-child {
                    margin-bottom: 0;
                }
                
                .recommendation-image {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 8px;
                    flex-shrink: 0;
                }
                
                .recommendation-info {
                    flex: 1;
                }
                
                .recommendation-title {
                    margin: 0 0 4px 0;
                    font-size: 0.95rem;
                    color: #333;
                    font-weight: 500;
                    line-height: 1.3;
                }
                
                .recommendation-price {
                    margin: 0 0 8px 0;
                    color: #667eea;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                .btn-recommendation-add {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: background 0.3s;
                }
                
                .btn-recommendation-add:hover {
                    background: #5a67d8;
                }
                
                .recommendation-footer {
                    padding: 12px 16px;
                    border-top: 1px solid #e0e0e0;
                    text-align: center;
                }
                
                .btn-close-all {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background 0.3s;
                }
                
                .btn-close-all:hover {
                    background: #545b62;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remover recomendações anteriores
        const existingModal = document.querySelector('.recommendation-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Adicionar ao DOM
        document.body.appendChild(recommendationModal);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (recommendationModal.parentNode) {
                recommendationModal.style.animation = 'slideOutDown 0.5s ease';
                setTimeout(() => recommendationModal.remove(), 500);
            }
        }, 10000);
        
    } catch (error) {
        console.error('❌ Erro ao mostrar recomendações:', error);
    }
}

// ===== FUNÇÃO PARA OBTER PRODUTOS RECOMENDADOS =====
function getRecommendedProducts(productId) {
    try {
        const product = STATE.products.find(p => p.id === productId);
        if (!product) return [];
        
        // Estratégias de recomendação:
        // 1. Produtos da mesma categoria
        // 2. Produtos com preço similar
        // 3. Produtos mais populares
        // 4. Produtos em estoque
        
        const recommendations = [];
        
        // 1. Produtos da mesma categoria (exceto o próprio)
        const sameCategory = STATE.products.filter(p => 
            p.id !== productId && 
            p.categoryId === product.categoryId &&
            p.stock > 0
        );
        
        // 2. Produtos com preço similar (±30%)
        const priceRangeMin = parseFloat(product.price) * 0.7;
        const priceRangeMax = parseFloat(product.price) * 1.3;
        
        const similarPrice = STATE.products.filter(p => 
            p.id !== productId &&
            parseFloat(p.price) >= priceRangeMin &&
            parseFloat(p.price) <= priceRangeMax &&
            p.stock > 0
        );
        
        // 3. Produtos mais populares (com mais cliques)
        const popularProducts = STATE.products
            .filter(p => p.id !== productId && p.stock > 0)
            .sort((a, b) => {
                const statsA = JSON.parse(localStorage.getItem('productStats') || '{}')[a.id] || {};
                const statsB = JSON.parse(localStorage.getItem('productStats') || '{}')[b.id] || {};
                return (statsB.clickCount || 0) - (statsA.clickCount || 0);
            });
        
        // Combinar recomendações (evitar duplicados)
        const allRecommendations = [...sameCategory, ...similarPrice, ...popularProducts];
        const uniqueRecommendations = [];
        const seenIds = new Set();
        
        for (const rec of allRecommendations) {
            if (!seenIds.has(rec.id) && rec.id !== productId && rec.stock > 0) {
                seenIds.add(rec.id);
                uniqueRecommendations.push(rec);
                
                // Limitar a 3 recomendações
                if (uniqueRecommendations.length >= 3) break;
            }
        }
        
        console.log('📋 Produtos recomendados encontrados:', uniqueRecommendations.length);
        return uniqueRecommendations;
        
    } catch (error) {
        console.error('❌ Erro ao obter recomendações:', error);
        return [];
    }
}

// ===== FUNÇÃO PARA ADICIONAR PRODUTO RECOMENDADO AO CARRINHO =====
function addRecommendedToCart(productId) {
    try {
        console.log('🎯 Adicionando produto recomendado:', productId);
        
        const product = STATE.products.find(p => p.id === productId);
        if (!product) return;
        
        // Verificar se o produto já está no carrinho
        const existingItemIndex = STATE.cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex !== -1) {
            // Produto já está no carrinho - incrementar
            STATE.cart[existingItemIndex].quantity++;
            STATE.cart[existingItemIndex].updatedAt = new Date().toISOString();
        } else {
            // Adicionar novo item
            STATE.cart.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price) || 0,
                imageURL: product.imageURL,
                stock: product.stock,
                quantity: 1,
                category: product.categoryId || 'geral',
                addedAt: new Date().toISOString(),
                cartId: generateId()
            });
        }
        
        // Registrar no histórico
        registerCartAddition(product, 1);
        
        // Salvar carrinho
        localStorage.setItem('shoppingCart', JSON.stringify(STATE.cart));
        
        // Atualizar UI
        updateCartUI();
        updateCartBadge();
        
        // Mostrar feedback
        showMessage(`✅ ${product.name} adicionado ao carrinho!`, 'success');
        
        // Fechar modal de recomendações
        const recommendationModal = document.querySelector('.recommendation-modal');
        if (recommendationModal) {
            recommendationModal.remove();
        }
        
        // Atualizar estatísticas
        updateProductStats(product.id, 'add_to_cart', 1);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar produto recomendado:', error);
        showMessage('Erro ao adicionar produto.', 'error');
    }
}

// ===== FUNÇÃO PARA MOSTRAR PRODUTOS SIMILARES (para produtos esgotados) =====
function showSimilarProducts(productId) {
    try {
        const product = STATE.products.find(p => p.id === productId);
        if (!product) return;
        
        // Buscar produtos similares em estoque
        const similarProducts = STATE.products.filter(p => 
            p.id !== productId && 
            p.categoryId === product.categoryId &&
            p.stock > 0
        ).slice(0, 3);
        
        if (similarProducts.length === 0) return;
        
        // Criar mensagem com opções
        const message = `"${product.name}" está esgotado. 😔\n\nQue tal conferir estas alternativas similares?`;
        
        // Mostrar notificação com opções
        const notification = document.createElement('div');
        notification.className = 'similar-products-notification';
        notification.innerHTML = `
            <div class="similar-header">
                <h4><i class="fas fa-search"></i> Produto Esgotado</h4>
                <p>"${product.name}" está temporariamente indisponível.</p>
            </div>
            <div class="similar-grid">
                ${similarProducts.map(sim => `
                    <div class="similar-item">
                        <img src="${sim.imageURL || 'https://via.placeholder.com/60x60'}" 
                             alt="${sim.name}"
                             class="similar-image">
                        <div class="similar-info">
                            <h5 class="similar-title">${sim.name}</h5>
                            <p class="similar-price">R$ ${formatPrice(sim.price)}</p>
                            <button class="btn-similar-add" onclick="addRecommendedToCart('${sim.id}')">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Adicionar estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideInRight 0.4s ease;
            max-width: 350px;
            border-left: 4px solid #ffc107;
            overflow: hidden;
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Auto-remover
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
        
    } catch (error) {
        console.error('❌ Erro ao mostrar produtos similares:', error);
    }
}

// ===== FUNÇÃO AUXILIAR PARA FORMATAR PREÇO =====
function formatPrice(price) {
    const num = parseFloat(price) || 0;
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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
                injectProductSchema(product, category?.name);

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
                injectProductSchema(product, category?.name);

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


// ===== CONTADOR DE VISITANTES (VERSÃO SIMPLIFICADA E FUNCIONAL) =====

// Versão mais simples e confiável
async function initVisitorCounter() {
    try {
        console.log('👥 Iniciando contador de visitantes...');
        
        // Elemento para mostrar o contador
        let counterElement = document.getElementById('counter');
        let visitorCounterDiv = document.getElementById('visitor-counter');
        
        // Criar elemento se não existir
        if (!visitorCounterDiv) {
            visitorCounterDiv = document.createElement('div');
            visitorCounterDiv.id = 'visitor-counter';
            visitorCounterDiv.innerHTML = `
                <i class="fas fa-users me-1"></i>
                <span id="counter">0</span> visitantes
            `;
            visitorCounterDiv.style.cssText = `
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
                transition: all 0.3s ease;
            `;
            document.body.appendChild(visitorCounterDiv);
            counterElement = document.getElementById('counter');
        }
        
        // Se Firebase não estiver disponível, usar localStorage
        if (typeof firebase === 'undefined' || typeof db === 'undefined') {
            console.log('⚠️ Firebase não disponível, usando localStorage');
            initSimpleCounter();
            return;
        }
        
        // ID único para este dispositivo
        let deviceId = localStorage.getItem('comerciante_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('comerciante_device_id', deviceId);
            console.log('🆔 Novo device ID criado:', deviceId);
        }
        
        // Verificar se já foi contado hoje
        const today = new Date().toISOString().split('T')[0];
        const lastCountedDate = localStorage.getItem('last_counted_date');
        
        // Referência do Firebase
        const statsRef = db.collection('site_stats').doc('visitors');
        
        // Buscar dados atuais
        let currentStats;
        try {
            const doc = await statsRef.get();
            if (doc.exists) {
                currentStats = doc.data();
                // Mostrar contador atual
                if (counterElement && currentStats.total) {
                    counterElement.textContent = currentStats.total.toLocaleString('pt-BR');
                    animateCounter(counterElement, currentStats.total);
                }
            } else {
                // Criar documento se não existir
                currentStats = { total: 0, today: 0, devices: [], updatedAt: new Date() };
            }
        } catch (firebaseError) {
            console.error('❌ Erro ao acessar Firebase:', firebaseError);
            // Fallback para localStorage
            initSimpleCounter();
            return;
        }
        
        // Se já foi contado hoje, apenas mostrar
        if (lastCountedDate === today) {
            console.log('✅ Já contado hoje');
            return;
        }
        
        // Coletar dados básicos do visitante (sem IP para simplificar)
        const visitorData = {
            timestamp: new Date().toISOString(),
            deviceId: deviceId,
            userAgent: navigator.userAgent.substring(0, 100),
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            referrer: document.referrer || 'direct',
            pageUrl: window.location.href
        };
        
        // Incrementar contador
        try {
            const updateData = {
                total: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                today: firebase.firestore.FieldValue.increment(1),
                lastResetDate: today
            };
            
            // Adicionar dispositivo ao array se não existir
            if (!currentStats.devices || !currentStats.devices.includes(deviceId)) {
                updateData.devices = firebase.firestore.FieldValue.arrayUnion(deviceId);
            }
            
            // Salvar no Firebase
            await statsRef.set(updateData, { merge: true });
            
            // Atualizar localStorage
            localStorage.setItem('last_counted_date', today);
            
            // Buscar dados atualizados
            const updatedDoc = await statsRef.get();
            if (updatedDoc.exists) {
                const newStats = updatedDoc.data();
                if (counterElement) {
                    counterElement.textContent = newStats.total.toLocaleString('pt-BR');
                    animateCounter(counterElement, newStats.total);
                    
                    // Mostrar notificação para novo visitante
                    showSimpleNotification(`👋 ${newStats.total}º visitante!`);
                }
            }
            
            console.log('✅ Visitante contado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar contador:', error);
            // Fallback para localStorage
            initSimpleCounter();
        }
        
        // Adicionar clique para mostrar detalhes
        visitorCounterDiv.addEventListener('click', function() {
            showSimpleVisitorStats(statsRef);
        });
        
    } catch (error) {
        console.error('❌ Erro no contador:', error);
        initSimpleCounter();
    }
}

// Versão simples com localStorage
function initSimpleCounter() {
    console.log('💾 Usando contador simples (localStorage)');
    
    const key = 'comerciante_total_visits';
    let visits = localStorage.getItem(key);
    visits = visits ? parseInt(visits) + 1 : 1;
    localStorage.setItem(key, visits);
    
    const counterElement = document.getElementById('counter');
    if (counterElement) {
        counterElement.textContent = visits.toLocaleString('pt-BR');
        animateCounter(counterElement, visits);
    }
    
    // Mostrar notificação simples
    if (visits % 10 === 0) {
        showSimpleNotification(`🎉 ${visits} visitantes!`);
    }
}

// Função de animação simplificada
function animateCounter(element, finalNumber) {
    const current = parseInt(element.textContent.replace(/\D/g, '')) || 0;
    if (current >= finalNumber) return;
    
    let count = current;
    const increment = Math.ceil((finalNumber - current) / 30);
    
    const timer = setInterval(() => {
        count += increment;
        if (count >= finalNumber) {
            count = finalNumber;
            clearInterval(timer);
        }
        element.textContent = count.toLocaleString('pt-BR');
    }, 30);
}

// Notificação simples
function showSimpleNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #48bb78, #38a169);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <i class="fas fa-users me-2"></i>
            <div>
                <strong style="font-size: 14px;">${message}</strong>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                    Obrigado pela visita! ✨
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Estatísticas simples
async function showSimpleVisitorStats(statsRef) {
    try {
        const doc = await statsRef.get();
        if (!doc.exists) return;
        
        const stats = doc.data();
        
        const modalHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                     background: white; padding: 25px; border-radius: 15px; box-shadow: 0 15px 50px rgba(0,0,0,0.2);
                     z-index: 10000; min-width: 300px; max-width: 500px;">
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-chart-bar fa-2x mb-2" style="color: #667eea;"></i>
                    <h4 style="margin: 0; color: #2d3748; font-size: 18px;">Estatísticas do Site</h4>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.8em; font-weight: 800; color: #667eea;">${stats.total || 0}</div>
                        <div style="font-size: 0.8em; color: #718096;">Total</div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.8em; font-weight: 800; color: #48bb78;">${stats.today || 0}</div>
                        <div style="font-size: 0.8em; color: #718096;">Hoje</div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="font-size: 0.9em; color: #4a5568; margin-bottom: 8px;">
                        <i class="fas fa-calendar-day me-2"></i>Última atualização
                    </div>
                    <div style="font-size: 0.85em; color: #718096;">
                        ${stats.updatedAt ? new Date(stats.updatedAt.seconds * 1000).toLocaleString('pt-BR') : 'N/A'}
                    </div>
                </div>
                
                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove(); 
                               document.querySelector('[style*=\"background: rgba(0,0,0,0.5)\"]').remove()" 
                        style="width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; 
                               border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-times me-2"></i>Fechar
                </button>
            </div>
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.5); z-index: 9999;" 
                 onclick="this.remove(); this.previousElementSibling.remove()"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Erro ao mostrar estatísticas:', error);
        showSimpleNotification('Erro ao carregar estatísticas');
    }
}

// Adicionar animações CSS
const visitorStyles = document.createElement('style');
visitorStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    #visitor-counter:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
`;
document.head.appendChild(visitorStyles);


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







// ===== BOTÃO DIAMANTE - JAVASCRIPT SIMPLES =====

// Criar botão se não existir
function createDiamondButton() {
    if (document.getElementById('diamondTopBtn')) {
        return; // Já existe
    }
    
    const buttonHTML = `
        <button id="diamondTopBtn" class="diamond-top-btn" aria-label="Voltar ao topo" title="Clique para voltar ao topo">
            <div class="diamond-container">
                <div class="diamond-pendant">
                    <div class="pendant-chain">
                        <div class="chain-segment"></div>
                        <div class="chain-segment"></div>
                        <div class="chain-segment"></div>
                    </div>
                    <div class="diamond-gem">
                        <div class="diamond-facet df-1"></div>
                        <div class="diamond-facet df-2"></div>
                        <div class="diamond-facet df-3"></div>
                        <div class="diamond-facet df-4"></div>
                        <div class="diamond-core"></div>
                    </div>
                    <div class="sparkle s1"></div>
                    <div class="sparkle s2"></div>
                    <div class="sparkle s3"></div>
                </div>
                <div class="pendant-shadow"></div>
            </div>
        </button>
    `;
    
    // Adicionar ao body
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    console.log('✅ Botão diamante criado');
}

// Inicializar botão
function initDiamondButton() {
    // Criar botão
    createDiamondButton();
    
    const diamondBtn = document.getElementById('diamondTopBtn');
    if (!diamondBtn) return;
    
    // Controlar visibilidade com scroll
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 400) {
            diamondBtn.classList.add('visible');
        } else {
            diamondBtn.classList.remove('visible');
        }
    });
    
    // Ação de clique
    diamondBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Efeito visual
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);
        
        // Scroll suave para o topo
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Criar efeito de partículas
        createSparkleEffect(this);
    });
    
    // Mostrar inicialmente se já scrolled
    setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 400) {
            diamondBtn.classList.add('visible');
        }
    }, 100);
}

// Efeito de partículas
function createSparkleEffect(button) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height - 30;
    
    for (let i = 0; i < 6; i++) {
        const spark = document.createElement('div');
        spark.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            left: ${centerX}px;
            top: ${centerY}px;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.9);
        `;
        
        document.body.appendChild(spark);
        
        // Animação
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 40 + 30;
        
        spark.animate([
            {
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 40}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 600,
            easing: 'ease-out'
        });
        
        // Remover após animação
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 600);
    }
}

// Função de debug
function debugDiamondButton() {
    const btn = document.getElementById('diamondTopBtn');
    
    if (!btn) {
        console.log('❌ Botão não encontrado. Criando...');
        createDiamondButton();
        return;
    }
    
    console.log('✅ Botão encontrado!');
    console.log('📍 Posição:', btn.getBoundingClientRect());
    
    // Adicionar estilo de debug
    btn.classList.add('debug');
    
    // Remover debug após 5 segundos
    setTimeout(() => {
        btn.classList.remove('debug');
    }, 5000);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initDiamondButton);

// Se já estiver carregado, inicializar
if (document.readyState === 'complete') {
    initDiamondButton();
}

// Exportar para uso global
window.debugDiamondButton = debugDiamondButton;
window.initDiamondButton = initDiamondButton;





// ===== FUNÇÕES DE PAGINAÇÃO COMPLETAS =====

// Função para atualizar o botão "Carregar mais"
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.disabled = STATE.pagination.loading;
    
    const icon = loadMoreBtn.querySelector('i');
    if (icon) {
        if (STATE.pagination.loading) {
            icon.classList.add('fa-spin');
        } else {
            icon.classList.remove('fa-spin');
        }
    }
    
    loadMoreBtn.innerHTML = `
        <i class="fas fa-sync-alt ${STATE.pagination.loading ? 'fa-spin' : ''}"></i>
        ${STATE.pagination.loading ? 'Carregando...' : 'Carregar mais produtos'}
    `;
    
    // Atualizar contador
    const infoElement = loadMoreBtn.parentElement?.querySelector('.pagination-info');
    if (infoElement) {
        infoElement.textContent = `Mostrando ${STATE.products.length} produtos`;
    }
}

// Função para adicionar botão "Carregar mais" (versão simplificada)
function addLoadMoreButton() {
    const container = document.getElementById('selectedCategoryProducts');
    if (!container) return;
    
    // Remover botões existentes
    const existingBtn = document.getElementById('loadMoreBtn');
    const existingContainer = document.getElementById('loadMoreContainer');
    if (existingBtn) existingBtn.remove();
    if (existingContainer) existingContainer.remove();
    
    // Adicionar botão apenas se houver mais produtos
    if (STATE.pagination.hasMore && STATE.products.length > 0) {
        const loadMoreHTML = `
            <div class="load-more-container" id="loadMoreContainer" style="grid-column: 1 / -1; text-align: center; margin: 40px 0;">
                <button id="loadMoreBtn" class="load-more-btn" onclick="loadMoreProducts()">
                    <i class="fas fa-sync-alt"></i>
                    Carregar mais produtos
                </button>
                <div class="pagination-info" style="margin-top: 10px; color: #666; font-size: 12px;">
                    Mostrando ${STATE.products.length} produtos
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', loadMoreHTML);
        updateLoadMoreButton();
    }
}

// Função para exibir produtos com paginação
function displayProductsWithPagination(products) {
    const container = document.getElementById('selectedCategoryProducts');
    if (!container) return;
    
    // Limpar apenas na primeira página
    if (STATE.pagination.currentPage === 1) {
        container.innerHTML = '';
    }
    
    // Se não há produtos, mostrar mensagem
    if (!products || products.length === 0) {
        if (STATE.pagination.currentPage === 1) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3 style="color: #666; margin-bottom: 10px;">Nenhum produto encontrado</h3>
                    <p style="color: #999;">Tente outra categoria ou volte mais tarde</p>
                </div>
            `;
        }
        return;
    }
    
    // Gerar HTML dos produtos
    const productsHTML = products.map(product => {
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
                                onclick="addToCart('${product.id}')" 
                                ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-bag"></i> 
                            ${isOutOfStock ? 'Esgotado' : 'Comprar'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Adicionar produtos ao container
    container.insertAdjacentHTML('beforeend', productsHTML);
    
    // Adicionar botão "Carregar mais"
    addLoadMoreButton();
}

function createCategoryLinks() {
    const container = document.querySelector('.category-buttons');
    if (!container) return;
    
    container.innerHTML = STATE.categories.map(category => `
        <a href="paginas/${category.id}.html" class="category-link">
            <i class="fas fa-folder"></i> ${category.name}
        </a>
    `).join('');
}

// Função para carregar dados da página de categoria
async function loadCategoryPage() {
    try {
        // Extrai o ID da categoria da URL
        const urlParams = new URLSearchParams(window.location.search);
        let categoryId = urlParams.get('categoria') || '';
        
        // Se não tem na URL, tenta extrair do nome do arquivo
        if (!categoryId) {
            const path = window.location.pathname;
            const fileName = path.split('/').pop().replace('.html', '');
            
            // Procura categoria pelo nome do arquivo
            const category = STATE.categories.find(cat => 
                cat.id === fileName || 
                normalizeString(cat.name) === fileName
            );
            
            categoryId = category ? category.id : null;
        }
        
        if (categoryId) {
            await loadProductsByCategory(categoryId);
            
            // Atualizar título da página
            const category = STATE.categories.find(cat => cat.id === categoryId);
            if (category) {
                document.title = `${category.name} - Quero'Luxo`;
                const titleElement = document.getElementById('categoryPageTitle');
                if (titleElement) {
                    titleElement.textContent = category.name;
                }
            }
        } else {
            // Se não encontrar categoria, carrega todos os produtos
            await loadProducts();
        }
    } catch (error) {
        console.error('Erro ao carregar página de categoria:', error);
    }
}

// Função para normalizar strings (remover acentos, espaços, etc.)
function normalizeString(str) {
    return str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

// Função para gerar páginas dinamicamente (para admin)
async function generateCategoryPages() {
    if (!STATE.isOnline) {
        console.log('Modo offline - não é possível gerar páginas');
        return;
    }
    
    try {
        console.log('📄 Gerando páginas de categorias...');
        
        // Carrega template da página de categoria
        const response = await fetch('categoria-template.html');
        const template = await response.text();
        
        // Para cada categoria, cria uma página
        for (const category of STATE.categories) {
            const pageContent = template
                .replace(/\{\{CATEGORY_NAME\}\}/g, category.name)
                .replace(/\{\{CATEGORY_ID\}\}/g, category.id);
            
            // Aqui você pode salvar no Firebase Storage ou gerar arquivo estático
            console.log(`✅ Página gerada para: ${category.name}`);
        }
        
        showMessage('Páginas de categorias atualizadas!', 'success');
    } catch (error) {
        console.error('Erro ao gerar páginas:', error);
    }
}

// Adicione esta função para testar
function debugCategorySystem() {
    console.group('🔧 DEBUG - Sistema de Categorias');
    console.log('📊 Estado atual:');
    console.log('- Categorias carregadas:', STATE.categories.length);
    console.log('- Categoria atual:', STATE.currentCategory);
    console.log('- Subcategoria atual:', STATE.currentSubcategory);
    console.log('- Produtos carregados:', STATE.products.length);
    
    console.log('🏗️ Elementos DOM:');
    console.log('- Container de produtos:', document.getElementById('selectedCategoryProducts'));
    console.log('- Botões de categoria:', document.querySelectorAll('.category-btn').length);
    console.log('- Navegação de subcategorias:', document.getElementById('subcategoryNav'));
    
    // Testar carregamento manual
    if (STATE.categories.length > 0) {
        console.log('🧪 Testando carregamento da primeira categoria...');
        setTimeout(() => {
            loadProductsByCategory(STATE.categories[0].id);
        }, 1000);
    }
    
    console.groupEnd();
}

// Chame esta função se necessário
// debugCategorySystem();

// Função de debug para testar o sistema
function testCategorySystem() {
    console.group('🧪 TESTE - Sistema de Categorias');
    
    // Verificar elementos
    console.log('1. Verificando elementos DOM:');
    console.log('- Container de produtos:', document.getElementById('selectedCategoryProducts'));
    console.log('- Seção de categoria:', document.getElementById('categoryProductsSection'));
    console.log('- Botões de categoria:', document.querySelectorAll('.category-btn').length);
    
    // Verificar estado
    console.log('2. Verificando estado:');
    console.log('- Categorias:', STATE.categories.length);
    console.log('- Categoria atual:', STATE.currentCategory);
    console.log('- Subcategoria atual:', STATE.currentSubcategory);
    
    // Testar criação da seção
    console.log('3. Testando criação da seção...');
    const container = createCategoryProductsSection();
    console.log('- Seção criada:', !!container);
    
    // Testar carregamento de categoria
    if (STATE.categories.length > 0) {
        console.log('4. Testando carregamento da primeira categoria...');
        const firstCategory = STATE.categories[0];
        console.log('- Primeira categoria:', firstCategory.name, firstCategory.id);
        
        // Testar carregamento
        setTimeout(() => {
            handleCategoryClick(firstCategory.id);
        }, 1000);
    }
    
    console.groupEnd();
}

// Execute após a inicialização
// setTimeout(testCategorySystem, 2000);
// ===== SCHEMA.ORG PRODUCT + REVIEWS =====
function injectProductSchema(product) {
  if (!product) return;

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];

  const aggregateRating = reviews.length
    ? {
        "@type": "AggregateRating",
        "ratingValue": (
          reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        ).toFixed(1),
        "reviewCount": reviews.length
      }
    : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.imageURL,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "BRL",
      "price": product.price,
      "availability": product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    }
  };

  if (aggregateRating) {
    schema.aggregateRating = aggregateRating;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);

  document.head.appendChild(script);
}

async function loadProductReviews(productId) {
    console.log('⭐ Carregando avaliações do produto:', productId);

    const reviewsContainer = document.getElementById('productReviews');

    if (!reviewsContainer) {
        console.error('❌ Container de reviews não encontrado');
        return;
    }

    reviewsContainer.innerHTML = '<p>Carregando avaliações...</p>';

    try {
        const snapshot = await db
            .collection('productReviews')
            .where('productId', '==', productId)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            reviewsContainer.innerHTML = '<p>Este produto ainda não possui avaliações.</p>';
            return;
        }

        const reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderProductReviews(reviews);

    } catch (error) {
        console.error('❌ Erro ao carregar avaliações:', error);
        reviewsContainer.innerHTML = '<p>Erro ao carregar avaliações.</p>';
    }
}


function renderProductReviews(reviews) {
    const container = document.getElementById('productReviews');

    container.innerHTML = reviews.map(review => `
        <div class="review-item" itemprop="review" itemscope itemtype="https://schema.org/Review">
            <meta itemprop="datePublished" content="${review.createdAt?.toDate()?.toISOString() || ''}">
            
            <div class="review-stars" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
                <meta itemprop="ratingValue" content="${review.rating}">
                ${'⭐'.repeat(review.rating)}
            </div>

            <p class="review-comment" itemprop="reviewBody">
                ${review.comment}
            </p>
        </div>
    `).join('');
}


function updateAggregateRating(productId, average, count) {
    const ratingValueEl = document.querySelector('[itemprop="ratingValue"]');
    const reviewCountEl = document.querySelector('[itemprop="reviewCount"]');

    if (ratingValueEl) ratingValueEl.textContent = average;
    if (reviewCountEl) reviewCountEl.textContent = count;

    // Atualizar estado local
    const product = STATE.products.find(p => p.id === productId);
    if (product) {
        product.rating = {
            average: parseFloat(average),
            count: count
        };
    }
}
async function submitReview(productId) {
    const ratingEl = document.getElementById('reviewRating');
    const commentEl = document.getElementById('reviewComment');

    const rating = parseInt(ratingEl.value);
    const comment = commentEl.value.trim();

    if (!rating || rating < 1 || rating > 5) {
        showMessage('Selecione uma nota válida', 'error');
        return;
    }

    if (!comment || comment.length < 5) {
        showMessage('Digite um comentário com pelo menos 5 caracteres', 'error');
        return;
    }

    try {
        await db.collection('productReviews').add({
            productId: productId,
            rating: rating,
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('⭐ Avaliação enviada com sucesso!', 'success');

        commentEl.value = '';
        ratingEl.value = '5';

        // Recarregar avaliações
        loadProductReviews(productId);

        // Atualizar média no produto
        await recalculateProductRating(productId);

    } catch (error) {
        console.error('❌ Erro ao enviar avaliação:', error);
        showMessage('Erro ao enviar avaliação', 'error');
    }
}

async function recalculateProductRating(productId) {
    const snapshot = await db
        .collection('productReviews')
        .where('productId', '==', productId)
        .get();

    if (snapshot.empty) return;

    let total = 0;
    snapshot.forEach(doc => {
        total += doc.data().rating;
    });

    const average = (total / snapshot.size).toFixed(1);

    await db.collection('products').doc(productId).update({
        rating: {
            average: Number(average),
            count: snapshot.size
        }
    });
}
