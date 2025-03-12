
  
// JavaScript
function openWhatsApp() {
  // Aqui, você deve buscar o número do WhatsApp no Firestore
  // Por exemplo, vamos supor que o número esteja na coleção "contato" e no documento com ID "whatsapp"
  const contatoRef = firestore.collection("contato").doc("whatsapp");

  contatoRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        const whatsappNumber = doc.data().whatsapp; // Supondo que o campo com o número seja chamado "whatsapp"
        if (whatsappNumber) {
          // Abre o link do WhatsApp com o número e uma mensagem pré-definida
          const message = "Olá, estou entrando em contato pelo site.";
          window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
        } else {
          alert("Número do WhatsApp não encontrado no Firestore.");
        }
      } else {
        alert("Documento do WhatsApp não encontrado no Firestore.");
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar o número do WhatsApp:", error);
    });
}

// Adiciona o evento de clique ao ícone de chat
const chatIcon = document.querySelector(".chat-icon");
chatIcon.addEventListener("click", openWhatsApp);

  // Função para exibir o diálogo de estoque esgotado
function showOutOfStockDialog() {
  const outOfStockDialog = document.getElementById("outOfStockDialog");
  outOfStockDialog.style.display = "block";
}

// Função para esconder o diálogo de estoque esgotado ao clicar no botão "OK"
function closeOutOfStockDialog() {
  const outOfStockDialog = document.getElementById("outOfStockDialog");
  outOfStockDialog.style.display = "none";
}

  
	 

 // Função para ocultar os botões do menu
  function hideMenu() {
    const menuButtons = document.getElementById("menuButtons");
    menuButtons.classList.remove("show");
  }

  // Função para exibir os botões do menu
  function showMenu() {
    const menuButtons = document.getElementById("menuButtons");
    menuButtons.classList.add("show");
  }

  // Adicione um event listener para ocultar os botões do menu quando a página carregar
  document.addEventListener("DOMContentLoaded", function() {
    hideMenu();
  });

  // Função para alternar entre mostrar e ocultar os botões do menu
  function toggleMenu() {
    const menuButtons = document.getElementById("menuButtons");
    menuButtons.classList.toggle("show");
  }

  let deliveryOption = 'pickup'; // Default option is 'pickup'
let deliveryFee = 2.00; // Define o valor da taxa de entrega para R$ 2,00

function handleDeliveryOptionChange() {
      const selectedDeliveryOption = document.getElementById("deliveryOption").value;
      const addressInput = document.getElementById("address");
      const cartTotalElement = document.getElementById("cartTotal"); // Elemento onde será exibido o valor total do carrinho

      // Se a opção selecionada for "pickup", desabilita o campo de endereço
      if (selectedDeliveryOption === "pickup") {
        addressInput.disabled = true;
        addressInput.value = ""; // Limpa o valor do campo de endereço

        // Define a taxa de entrega como 0, pois a opção é "pickup"
        deliveryFee = 0;

        // Calcula o total do carrinho sem a taxa de entrega
        const cartTotalWithoutDelivery = calculateTotal();

        // Atualiza o valor total do carrinho na interface
        cartTotalElement.textContent = `Total: R$ ${cartTotalWithoutDelivery.toFixed(2)}`;
      } else {
        // Caso contrário, habilita o campo de endereço
        addressInput.disabled = false;

        // Defina a taxa de entrega como desejado, por exemplo, 2.00 (R$ 2,00)
        deliveryFee = 2.00;

        // Calcula o total do carrinho com a taxa de entrega
        const cartTotalWithDelivery = calculateTotal();

        // Atualiza o valor total do carrinho na interface
        cartTotalElement.textContent = `Total: R$ ${cartTotalWithDelivery.toFixed(2)}`;
      }
    }
  // Variável para armazenar a referência para o listener do snapshot
let searchListener = null;
function searchProducts() {
  const searchText = document.getElementById("searchInput").value.trim().toLowerCase();

  // Verifica se a pesquisa está vazia
  if (searchText.length === 0) {
    // Se a pesquisa estiver vazia, interrompe o listener e carrega todos os produtos novamente
    if (searchListener) {
      searchListener();
      searchListener = null;
    }
    document.getElementById("menu0").innerHTML = ""; // Limpa o conteúdo da div de resultados
    loadProducts();
    return;
  }

  // Variável para armazenar os produtos encontrados na pesquisa
  const searchResults = [];

  // Função para buscar os produtos em todas as coleções
  function searchAllCollections() {
    const collections = ["ProdutosCat1", "ProdutosCat2", "ProdutosCat3","ProdutosCat4","ProdutosCat5"];
    collections.forEach((collection) => {
      const collectionRef = firestore.collection(collection);
      collectionRef.onSnapshot((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const product = doc.data();

          // Verifica se o nome ou as informações do produto contêm o texto pesquisado
          const nameContainsText = product.nome.toLowerCase().includes(searchText);
          const infoContainsText = product.informacoes.toLowerCase().includes(searchText);

          if (nameContainsText || infoContainsText) {
            searchResults.push(product);
          }
        });

        // Após buscar em todas as coleções, exibe os resultados encontrados na pesquisa em tempo real
        displaySearchResults(searchResults);
      });
    });
  }

  // Chama a função que busca em todas as coleções
  searchAllCollections();
}

function displaySearchResults(results) {
  const menuDiv = document.getElementById("menu0");
  menuDiv.innerHTML = ""; // Limpa o conteúdo existente antes de adicionar os novos produtos

  results.forEach((product) => {
    // Cria o card de produto e preenche com os dados do produto
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <img src="${product.imagemUrl}" alt="${product.nome}">
      <h3>${product.nome}</h3>
      <p>${product.informacoes}</p>
      <span>R$ ${product.valor}</span>
    `;

    // Botão "Adicionar ao Carrinho"
    const addToCartButton = document.createElement("button");
    addToCartButton.textContent = "Adicionar ao Carrinho";
    addToCartButton.addEventListener("click", () => addToCart(product.nome, product.valor));
    productCard.appendChild(addToCartButton);

    // Botão "Detalhes"
    const detailsButton = document.createElement("button");
    detailsButton.textContent = "Detalhes";
    detailsButton.addEventListener("click", () => showProductDetails(product));
    productCard.appendChild(detailsButton);

    menuDiv.appendChild(productCard); // Adiciona o card do produto ao menu
  });
}


  

  
// Função para verificar se o método de pagamento é dinheiro e mostrar o campo de troco
  // Função para verificar se o método de pagamento é dinheiro e mostrar o campo de troco
  function showTrocoField() {
    const paymentMethod = document.getElementById("paymentMethod").value;
    const trocoContainer = document.getElementById("trocoContainer");
    trocoContainer.style.display = paymentMethod === "Dinheiro" ? "block" : "none";

  }


function openCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  modal.style.display = "block";

  // Get the cart total with the delivery fee
  const cartTotalWithDelivery = calculateTotal() + deliveryFee;
  const formattedTotalWithDelivery = formatCurrency(cartTotalWithDelivery);

  // Update the modal content to display the total order value with the delivery fee
  const totalWithDeliveryElement = document.getElementById("totalWithDelivery");
  totalWithDeliveryElement.textContent = `Total com taxa de entrega: ${formattedTotalWithDelivery}`;
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  modal.style.display = "none";


}



// Função para verificar se a opção de entrega foi selecionada antes de finalizar o pedido
  function validateDeliveryOption() {
    const selectedDeliveryOption = document.getElementById("deliveryOption").value;
    if (selectedDeliveryOption === "") {
      alert("Por favor, selecione a opção de entrega antes de finalizar o pedido.");
      return false;
    }
    return true;
  }
  
  
function confirmPurchase() {
  let address = document.getElementById("address").value;
  let nome = document.getElementById("name").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const deliveryOption = document.getElementById("deliveryOption").value;
  const trocoInput = document.getElementById("troco");

  // Verifica se o campo do nome foi preenchido
  if (!nome) {
    alert("Por favor, informe o nome.");
    return;
  }
  
 

  // Verifica se algum dos campos está vazio
  if (!paymentMethod) {
    alert("Por favor, selecione o método de pagamento.");
    return;
  }
  
  
  // Verifica se a opção de entrega foi selecionada corretamente
  if (deliveryOption === "none") {
    alert("Por favor, selecione uma opção de entrega válida.");
    return;
  }

  // Verifica se a opção de entrega é "entrega" e se o campo do endereço foi preenchido
  if (deliveryOption === "delivery" && !address) {
    alert("Por favor, informe o endereço.");
    return;
  }
  // Monta a mensagem de pedido com as informações do carrinho e as informações adicionais
  let message = `Pedido de ${nome}:\n\n${getCartItemsAsString()}\n\n`;

  if (deliveryOption === "pickup") {
    // Caso a opção seja "retirada no estabelecimento", adiciona a mensagem correspondente
    message += "Retirada no estabelecimento\n\n";
    message += `Método de Pagamento: ${paymentMethod}\n\n`;

    // Calcula o total da compra sem a taxa de entrega
    const cartTotal = calculateTotal();
    const formattedTotal = formatCurrency(cartTotal);

    // Adiciona o total da compra sem entrega à mensagem
    message += `Total: ${formattedTotal}\n\n`;
	

  } else {
    // Caso contrário, a opção é entrega e precisamos calcular o total com a taxa de entrega
    const cartTotalWithDelivery = calculateTotal() + deliveryFee;
    const formattedTotalWithDelivery = formatCurrency(cartTotalWithDelivery);
	
 // Verifica se o campo do nome foi preenchido
  if (!address) {
    alert("Por favor, informe o endereço.");
    return;
  }
  
    // Caso a opção seja "delivery", adiciona as informações de entrega à mensagem
    message += `Taxa de entrega inclusa: ${formatCurrency(deliveryFee)}\n\n`;

    // Adiciona o total da compra com entrega à mensagem
    message += `Total com entrega: ${formattedTotalWithDelivery}\n\n`;

    // Verifica se o método de pagamento é dinheiro e, se for, obtém o valor do troco
    let troco = 0;
    if (paymentMethod === "Dinheiro") {
      troco = parseFloat(document.getElementById("troco").value);
      if (isNaN(troco)) {
        alert("Por favor, informe o valor do troco.");
        return;
      }

      // Verifica se o troco é suficiente para concluir a compra
      if (troco < cartTotalWithDelivery) {
        alert("O valor do troco é insuficiente. Por favor, verifique o valor informado.");
        return;
      }

      // Caso o método de pagamento seja "Dinheiro", adiciona informações sobre o troco
      message += `Total: ${formattedTotalWithDelivery}\n\n`;
      message += `Método de Pagamento: Dinheiro\nTroco para: R$ ${troco.toFixed(2)}\n\n`;
	   // Reduz a quantidade em estoque dos produtos
      cartItems.forEach((item) => {
	  updateStockQuantityOnPurchase();
      });
    } else {
      // Caso o método de pagamento seja "Cartao" ou "Pix", a compra é finalizada diretamente
      message += `Método de Pagamento: ${paymentMethod}\n\n`;
	  updateStockQuantityOnPurchase();
	    closeCheckoutModal();


	     

	  
    }
  }

  // Chama a função para enviar o pedido para o WhatsApp
  sendOrderToWhatsApp(message);
   updateStockQuantityOnPurchase();
     closeCheckoutModal();

   

}


// Função para enviar o pedido para o WhatsApp
function sendOrderToWhatsApp(message) {



  // Verifica se a variável phoneNumber foi preenchida corretamente
  if (!phoneNumber) {
    alert("Número de WhatsApp não disponível. Por favor, entre em contato com o vendedor.");
    return;
  }
 // Adiciona a quantidade de cada item ao pedido
  cartItems.forEach((item) => {
    message += `\n${item.name} - Quantidade: ${item.quantity}`;
  });
  
  // URL para abrir o aplicativo WhatsApp com a mensagem de pedido pré-preenchida
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

  // Abre o aplicativo WhatsApp no dispositivo
  window.open(whatsappUrl);
}

function toggleCart() {
  const cart = document.getElementById("cart");
  if (cart.style.display === "none") {
    cart.style.display = "block";
  } else {
    cart.style.display = "none";
  }
}


  function openWhatsApp() {
  // Verifica se a variável phoneNumber foi preenchida corretamente
  if (!phoneNumber) {
    alert("Número de WhatsApp não disponível. Por favor, entre em contato com o vendedor.");
    return;
  }

  // URL para abrir o aplicativo WhatsApp
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}`;

  // Abre o aplicativo WhatsApp no dispositivo
  window.open(whatsappUrl);

}

  let phoneNumber;
  let instagramLink;


  
   // Função para verificar se o carrinho está vazio
  function isCartEmpty() {
    return cartItems.length === 0;
  }
  

   // Função para finalizar a compra e mostrar a caixa de diálogo de confirmação
function finalizePurchase() {
  // Verifica se a opção de entrega foi selecionada antes de prosseguir
  if (!validateDeliveryOption()) {
    return;
  }

  const address = document.getElementById("address").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const deliveryOption = document.getElementById("deliveryOption").value;

  if (isCartEmpty()) {
    alert("O carrinho está vazio. Adicione itens ao carrinho antes de finalizar a compra.");
    return;
  }

  const cartTotal = calculateTotal();
  const formattedTotal = formatCurrency(cartTotal);

  // Monta a mensagem de confirmação com as informações do carrinho
  const message = `Confirma a compra dos seguintes itens?\n\n${getCartItemsAsString()}\n\nTotal: ${formattedTotal}`;

  const confirmed = window.confirm(message);

  if (confirmed) {
    // Atualiza a quantidade em estoque dos produtos comprados
    updateStockQuantityOnPurchase();

    // Aqui você pode prosseguir com a finalização da compra, como redirecionar para a página de pagamento ou realizar alguma ação no backend

    alert("Compra finalizada com sucesso!");

    // Fecha o diálogo após exibir a mensagem de "Compra finalizada com sucesso!"
    closePurchaseDialog();
  } else {
    // Caso o usuário clique em "Cancelar", você pode adicionar alguma ação aqui se necessário
    console.log("Compra cancelada pelo usuário.");
  }
}

// Função para atualizar a quantidade em estoque dos produtos comprados
function updateStockQuantityOnPurchase() {
  for (const item of cartItems) {
    const productName = item.name;
    const quantityPurchased = item.quantity; // Obtém a quantidade comprada para cada produto

    // Chame a função de atualizar estoque com o nome do produto, a quantidade comprada
    // e o nome da coleção correta
    updateStockQuantity("ProdutosCat3", productName, -quantityPurchased); // Substitua "cats5" pelo nome da coleção correta para esse produto
    updateStockQuantity("ProdutosCat2", productName, -quantityPurchased); // Substitua "cats" pelo nome da outra coleção, se necessário
	updateStockQuantity("ProdutosCat1", productName, -quantityPurchased); // Substitua "cats" pelo nome da outra coleção, se necessário


  }
}

  
  
   // Função para atualizar o estoque no Firestore
  function updateStockQuantity(productName, quantityChange) {
    // Obter o documento do produto no Firestore
    const productRef = firestore.collection("cats").where("nome", "==", productName);

    // Fazer a consulta e atualizar a quantidade do estoque
    productRef.get().then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const productData = doc.data();
        const currentQuantity = productData.quantidade || 0;

        // Garantir que a quantidade do estoque não se torne negativa
        const newQuantity = Math.max(currentQuantity + quantityChange, 0);

        // Atualizar a quantidade do estoque no Firestore
        doc.ref.update({ quantidade: newQuantity }).then(() => {
          console.log(`Quantidade do produto "${productName}" atualizada para ${newQuantity}`);
        }).catch((error) => {
          console.error("Erro ao atualizar a quantidade do estoque:", error);
        });
      }
    }).catch((error) => {
      console.error("Erro ao obter o documento do produto:", error);
    });
  }

 // Função para atualizar o botão "Finalizar Compra" com base no carrinho
function updateFinalizarButton() {
  const finalizarButton = document.getElementById("finalizarButton");
  finalizarButton.disabled = cartItems.length === 0;
}

  // Função para retornar os itens do carrinho como uma string formatada
  function getCartItemsAsString() {
    return cartItems.map(item => `${item.name} - R$ ${item.price.toFixed(2)}`).join('\n');
  }
  
  

    // Função para ir para a página do carrinho
    function goToCartPage() {
      window.location.href = "cart.html"; // Redireciona para a página do carrinho
    }
	
  // Configurações do seu projeto do Firebase
    const firebaseConfig = {
  apiKey: "AIzaSyA-7HOp-Ycvyf3b_03ev__8aJEwAbWSQZY",
  authDomain: "connectfamilia-312dc.firebaseapp.com",
  projectId: "connectfamilia-312dc",
  storageBucket: "connectfamilia-312dc.appspot.com",
  messagingSenderId: "797817838649",
  appId: "1:797817838649:web:1aa7c54abd97661f8d81e8",
  measurementId: "G-QKN9NFXZZQ"
};

	
// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);

// Obtenha uma referência para a coleção 'cats' no Firestore
const firestore = firebase.firestore();
const catsCollectionRef = firestore.collection("cats5");
const dadosCollectionRef = firestore.collection("dadosLandPage");

// Variável para armazenar os itens no carrinho
const cartItems = [];

// Função para ir para a página do carrinho
function goToCartPage() {
  window.location.href = "cart.html"; // Redireciona para a página do carrinho
}

// Consulta para obter um documento aleatório da coleção ImgAnuncio
firestore.collection("ImgAnuncio").get().then((querySnapshot) => {
  // Obtem o primeiro documento aleatório do resultado da consulta
  const doc = querySnapshot.docs[Math.floor(Math.random() * querySnapshot.size)];

  if (doc.exists) {
    // Se o documento existe, obtem os URLs das imagens (img1, img2, img3, img4)
    const data = doc.data();
    const imgUrls = [data.img1, data.img2, data.img3, data.img4];

    let currentIndex = 0;

    // Função para atualizar a imagem do anúncio
    function updateAnuncioImage() {
      const anuncioImage = document.getElementById("anuncioImage");
      anuncioImage.src = imgUrls[currentIndex];
      currentIndex = (currentIndex + 1) % imgUrls.length;
    }

    // Atualiza a imagem inicialmente e define um intervalo para atualizá-la a cada 3 segundos
    updateAnuncioImage();
    setInterval(updateAnuncioImage, 5000);
  }
}).catch((error) => {
  console.error("Erro ao obter imagens do Firestore: ", error);
});

function loadCategory(category) {
  const menuElement = document.getElementById('menu');
  menuElement.innerHTML = ''; // Limpa a lista de produtos

  // Consulta a coleção no Firestore com base na categoria selecionada
  firestore.collection(category).get()
    .then((querySnapshot) => {
      const selectedCategoryProducts = document.getElementById('selectedCategoryProducts');
      selectedCategoryProducts.innerHTML = ''; // Limpa a div de produtos antes de exibir os novos

      // Obtenha o título do cardápio com base na categoria selecionada e defina-o no elemento h2
      const categoryTitleElement = document.getElementById('categoryTitle');
      categoryTitleElement.textContent = getCategoryTitle(category);

      // Adicione a classe custom-category-name ao categoryTitleElement
      categoryTitleElement.classList.add('custom-category-name');

      querySnapshot.forEach((doc) => {
        const product = doc.data();
        const productCard = createProductCard(product);
        selectedCategoryProducts.appendChild(productCard);
      });

      // Carrega as marcas disponíveis com base na categoria selecionada
      loadMarcasByCategory(category);
    })
    .catch((error) => {
      console.log('Erro ao carregar os produtos:', error);
    });
}

// Função para obter as marcas disponíveis com base na categoria selecionada
function loadMarcasByCategory(category) {
  const marcaSelect = document.getElementById("marcaSelect");

  // Limpa as opções de marca atuais no elemento de seleção
  marcaSelect.innerHTML = '<option value="">Todas as marcas</option>'; // Adiciona a opção padrão "Todas as marcas"

  // Consulta a coleção no Firestore com base na categoria selecionada
  firestore.collection(category).get()
    .then((querySnapshot) => {
      let marcas = [""]; // Inicializa o array de marcas com uma opção vazia para "Todas as marcas"

      querySnapshot.forEach((doc) => {
        const product = doc.data();
        const marca = product.marca;
        if (!marcas.includes(marca)) {
          marcas.push(marca);
        }
      });

      // Adiciona as opções de marca no elemento de seleção
      marcas.forEach((marca) => {
        const option = document.createElement("option");
        option.value = marca;
        option.textContent = marca || "Todas as marcas"; // Se a marca for vazia, mostra a opção "Todas as marcas"
        marcaSelect.appendChild(option);
      });

      // Adiciona um listener para detectar quando o usuário selecionar uma marca
      marcaSelect.addEventListener("change", () => {
        const selectedMarca = marcaSelect.value;
        filterProductsByMarca(selectedMarca, category); // Chamada da função filterProductsByMarca com a categoria selecionada
      });
    })
    .catch((error) => {
      console.error("Erro ao obter marcas do Firestore: ", error);
    });
}

// Função para filtrar os produtos por marca selecionada
function filterProductsByMarca(selectedMarca, selectedCategory) {
  const productsContainer = document.getElementById("selectedCategoryProducts");
  // Limpa os produtos atuais no contêiner
  productsContainer.innerHTML = "";

  // Consulta para obter os produtos filtrados por marca (ou todos os produtos se nenhuma marca for selecionada)
  let query = firestore.collection(selectedCategory); // Use a variável selectedCategory para acessar a coleção correta
  if (selectedMarca) {
    query = query.where("marca", "==", selectedMarca);
  }
  query.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      const productCard = createProductCard(product);
      productsContainer.appendChild(productCard);
    });
  }).catch((error) => {
    console.error("Erro ao obter produtos filtrados por marca: ", error);
  });
}



// Função para obter o título do cardápio com base na categoria selecionada
function getCategoryTitle(category) {
  switch (category) {
    case 'ProdutosCat1':
      return 'Camisetas';
    case 'ProdutosCat2':
      return 'Bermudas';
    case 'ProdutosCat3':
      return 'Inverno';
	case 'ProdutosCat4':
      return 'Roupas Intimas';
	case 'ProdutosCat5':
      return 'Joias';
    default:
      return '';
  }
}


function closeCart() {
  const cart = document.getElementById("cart");
  cart.style.display = "none";
}
function createProductCard(product) {
  const card = document.createElement('div');
  card.classList.add('product-card');

  const image = document.createElement('img');
  image.src = product.imagemUrl;
  card.appendChild(image);

  const name = document.createElement('h3');
  name.textContent = product.nome;
  card.appendChild(name);

  const marca = document.createElement('p');
  marca.textContent = `Marca: ${product.marca}`;
  card.appendChild(marca);

 
  const valueBlock = document.createElement('div');
  valueBlock.classList.add('product-info-block');

  const valueLabel = document.createElement('span');
  valueLabel.textContent = 'Valor: ';
  valueBlock.appendChild(valueLabel);

  const value = document.createElement('span');
  value.textContent = `R$ ${product.valor}`;
  valueBlock.appendChild(value);

  card.appendChild(valueBlock);

  const quantityBlock = document.createElement('div');
  quantityBlock.classList.add('product-info-block');

  const quantityLabel = document.createElement('span');
  quantityLabel.style.fontWeight = 'normal';
  quantityLabel.textContent = 'Quantidade: ';
  quantityBlock.appendChild(quantityLabel);

  const quantity = document.createElement('span');
  quantity.textContent = product.quantidade;
  quantityBlock.appendChild(quantity);

  card.appendChild(quantityBlock);

  const addToCartButton = document.createElement('button');
  addToCartButton.textContent = 'Adicionar ao Carrinho';
  addToCartButton.classList.add('product-add-to-cart-button');
  addToCartButton.addEventListener('click', () => addToCart(product.nome, product.valor, product.quantidade));
  card.appendChild(addToCartButton);

  const detailsButton = document.createElement('button');
  detailsButton.textContent = 'Detalhes';
  detailsButton.classList.add('product-details-button');
  detailsButton.addEventListener('click', () => showProductDetails(product));
  card.appendChild(detailsButton);

  return card;
}

// Função para retornar o título da categoria com base no nome da coleção
function getCategoryTitle(category) {
  if (category === 'ProdutosCat1') {
    return 'Camisetas';
  } else if (category === 'ProdutosCat2') {
    return 'Bermudas';
  } else if (category === 'ProdutosCat3') {
    return 'Inverno';
  }else if (category === 'ProdutosCat4') {
    return 'Roupas Intimas';
  }else if (category === 'ProdutosCat5') {
    return 'Joias';
  } else {
    return 'Categoria não especificada';
  }
}


function loadProducts() {
  const produtosCat1CollectionRef = firestore.collection("ProdutosCat1");
  const menuDiv = document.getElementById("menu");
  menuDiv.innerHTML = "";

  produtosCat1CollectionRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const product = doc.data();

      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.innerHTML = `
        <img src="${product.imagemUrl}" alt="${product.nome}">
        <h3>${product.nome}</h3>
        <span>R$ ${product.valor}</span>
        <p>Quantidade em estoque: ${product.quantidade}</p>
      `;

      const addToCartButton = document.createElement("button");
      addToCartButton.textContent = "Adicionar ao Carrinho";
      addToCartButton.addEventListener("click", () => addToCart(product.nome, product.valor, product.quantidade));
      productCard.appendChild(addToCartButton);

      const detailsButton = document.createElement("button"); // Cria o botão DETALHES
      detailsButton.textContent = "DETALHES";
      detailsButton.addEventListener("click", () => showProductDetails(product)); // Chama a função showProductDetails ao clicar
      productCard.appendChild(detailsButton);

      menuDiv.appendChild(productCard);
    });
  }).catch((error) => {
    console.error("Erro ao carregar produtos da coleção 'ProdutosCat1':", error);
  });
}

function showProductDetails(product) {
  const productDetailsDialog = document.getElementById("productDetailsDialog");
  const productDetailsContent = document.getElementById("productDetailsContent");
  const closeDetailsButton = document.getElementById("closeDetailsButton");

  // Cria um elemento para a galeria de imagens
  const imageGallery = document.createElement("div");
  imageGallery.classList.add("image-gallery");

  // Monta uma string com as tags <img> para as imagens disponíveis
  let imagesHtml = "";
  for (let i = 1; i <= 5; i++) {
    const imageUrlKey = `imagemUrl${i}`;
    const imageUrl = product[imageUrlKey];

    if (imageUrl) {
      const imgElement = document.createElement("img");
      imgElement.src = imageUrl;
      imgElement.alt = product.nome;
      imgElement.className = "product-image";
      imgElement.addEventListener("click", () => openFullscreenImage(imageUrl));

      imageGallery.appendChild(imgElement);
    }
  }

  // Define o HTML da galeria de imagens
  productDetailsContent.innerHTML = `
    <h3>${product.nome}</h3>
    <p>Preço: R$ ${product.valor}</p>
    <p>Estoque Disponível: ${product.quantidade}</p>
    <p>Informações: ${product.informacoes}</p>
    <div class="larger-image-container"></div>
  `;
  productDetailsContent.appendChild(imageGallery);

  // Exibe a div de detalhes do produto
  productDetailsDialog.style.display = "block";

 // Adiciona um evento de clique para fechar a div de detalhes
  closeDetailsButton.addEventListener("click", () => {
    productDetailsDialog.style.display = "none";
    closeFullscreenImage();
  });
}

function openFullscreenImage(imageUrl) {
  const fullscreenImageOverlay = document.getElementById("fullscreenImageOverlay");
  const fullscreenImage = document.getElementById("fullscreenImage");

  fullscreenImage.src = imageUrl;
  fullscreenImage.alt = "Imagem em Tamanho Real";

  fullscreenImageOverlay.style.display = "flex";
}

// Adiciona um evento de clique para fechar a imagem em tamanho real
fullscreenImageOverlay.addEventListener("click", () => {
  closeFullscreenImage();
});

function closeFullscreenImage() {
  const fullscreenImageOverlay = document.getElementById("fullscreenImageOverlay");
  fullscreenImageOverlay.style.display = "none";
}


// Função para carregar a imagem de perfil e os produtos quando a página carrega
window.onload = function () {
  loadProfileImage();
  loadProducts();

  updateFinalizarButton(); // Atualiza o estado do botão "Finalizar Compra" ao carregar a página
};



	
	
  

 function loadProfileImage() {
  // Consulta para buscar o documento com a imagem de perfil, o número de WhatsApp e o link do Instagram
  dadosCollectionRef.limit(1).get().then((querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const imageUrl = doc.data().imageLogoUrl;
      const profileImg = document.getElementById("profileImage");
      profileImg.src = imageUrl;

      const profileName = doc.data().nome; // Obtém o nome do perfil
      const profileNameElement = document.getElementById("profileName");
      profileNameElement.textContent = profileName; // Define o nome do perfil na página

      // Armazena o número de WhatsApp e o link do Instagram nas variáveis globais
      phoneNumber = doc.data().whatsapp;
      instagramLink = doc.data().instagram;
    }
  });
}






  function submitPrompt() {
    customPromptDialog.style.display = "none";

    const promptInput = document.getElementById("promptInput");
    const quantity = promptInput.value;
    const parsedQuantity = parseInt(quantity);

    // Obtenha as informações do produto a partir dos atributos data-*
    const productName = promptInput.getAttribute("data-product-name");
    const productPrice = parseFloat(promptInput.getAttribute("data-product-price"));
    const productStock = parseInt(promptInput.getAttribute("data-product-stock"));

    // Verifica se a quantidade é um número válido e está dentro do estoque disponível
    if (isNaN(parsedQuantity) || parsedQuantity <= 0 || parsedQuantity > productStock) {
      alert("Quantidade inválida. Por favor, insira um valor numérico válido dentro do estoque disponível.");
      return;
    }

    // Adiciona o objeto do produto (nome, preço e estoque) ao array cartItems com a quantidade informada
    cartItems.push({ name: productName, price: productPrice, stock: productStock, quantity: parsedQuantity });

    // Atualiza a taxa de entrega se a opção de entrega for escolhida
    if (deliveryOption === 'delivery') {
      deliveryFee = 2.00;
    }

    // Mostra o carrinho após adicionar o primeiro item
    const cart = document.getElementById("cart");
    cart.classList.add("show");

    // Atualiza a lista de itens no carrinho exibida na página
    updateCartItems();

    // Chama a função calculateTotal() para atualizar o valor total
    const total = calculateTotal();
    console.log("Total calculated:", total);
    console.log("Items in the cart:", cartItems); // Exibe os itens do carrinho no console
    updateFinalizarButton(); // Atualiza o estado do botão "Finalizar Compra"
    updateCartTotal(); // Atualiza o total do carrinho na página
	    showMessage(`Produto "${productName}" adicionado ao carrinho.`);

  }

function addToCart(productName, productPrice, productStock) {
 // Verifica se o produto está em estoque
if (productStock <= 0) {
  showOutOfStockDialog();
  return;
}


  const customPromptDialog = document.getElementById("customPromptDialog");
  const promptText = document.getElementById("promptText");
  const promptInput = document.getElementById("promptInput");

  // Defina o texto e o tamanho da fonte no diálogo personalizado

  promptText.textContent = `Adicionar ao carrinho "${productName}" (Disponível: ${productStock}):`;
  promptText.style.fontSize = "24px"; // Tamanho da fonte personalizado

  // Defina os atributos data-* no input para acessar as informações do produto posteriormente
  promptInput.setAttribute("data-product-name", productName);
  promptInput.setAttribute("data-product-price", productPrice);
  promptInput.setAttribute("data-product-stock", productStock);

  promptInput.value = "1";
  promptInput.style.fontSize = "24px"; // Tamanho da fonte personalizado

  // Mostra o diálogo personalizado
  customPromptDialog.style.display = "block";

}
function showMessage(message) {
  const messageBox = document.getElementById("messageBox");
  messageBox.textContent = message;
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 3000); // A mensagem será ocultada após 3 segundos
}

// Função para atualizar o estoque no Firestore
function updateStockQuantity(collectionName, productName, quantityChange) {
  // Obter o documento do produto na coleção especificada no Firestore
  const productRef = firestore.collection(collectionName).where("nome", "==", productName);

  // Fazer a consulta e atualizar a quantidade do estoque
  productRef.get().then((querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const productData = doc.data();
      const currentQuantity = productData.quantidade || 0;

      // Garantir que a quantidade do estoque não se torne negativa
      const newQuantity = Math.max(currentQuantity + quantityChange, 0);

      // Atualizar a quantidade do estoque no Firestore
      doc.ref.update({ quantidade: newQuantity }).then(() => {
        console.log(`Quantidade do produto "${productName}" na coleção "${collectionName}" atualizada para ${newQuantity}`);
      }).catch((error) => {
        console.error("Erro ao atualizar a quantidade do estoque:", error);
      });
    }
  }).catch((error) => {
    console.error("Erro ao obter o documento do produto:", error);
  });
}


function removeFromCartAndRestoreStock(index) {
  if (index >= 0 && index < cartItems.length) {
    const removedItem = cartItems.splice(index, 1)[0]; // Remove o item do array de cartItems e obtém o item removido

    // Restaura a quantidade do estoque ao remover o item do carrinho
    updateStockQuantity(removedItem.name, 1);

    updateCartItems(); // Atualiza a exibição do carrinho na página
    updateFinalizarButton(); // Atualiza o estado do botão "Finalizar Compra"
    updateCartTotal();
  }
}
function calculateTotal() {
  let total = 0;
  cartItems.forEach((item) => {
    total += item.price * item.quantity;
  });

  if (deliveryOption === "delivery") {
    total += 2.00; // Adicione a taxa de entrega ao total
  }

  return total;
}

    // Função para formatar o valor como moeda
    function formatCurrency(value) {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

  // Função para remover um item do carrinho
function removeFromCart(index) {
  if (index >= 0 && index < cartItems.length) {
    cartItems.splice(index, 1); // Remove o item do array de cartItems
    updateCartItems(); // Atualiza a exibição do carrinho na página
    updateFinalizarButton(); // Atualiza o estado do botão "Finalizar Compra"
	    updateCartTotal();

  }
}

 function createRemoveButton(index) {
    const removeButton = document.createElement("i");
    removeButton.className = "fas fa-trash-alt removeButton"; // Classe do ícone de lixeira do Font Awesome
    removeButton.addEventListener("click", () => removeFromCart(index));
    return removeButton;
  }function updateCartTotal() {
  const cartTotalElement = document.getElementById("cartTotal");
  const cartDeliveryFeeElement = document.getElementById("cartDeliveryFee");

  const cartTotal = calculateTotal();
  const formattedTotal = formatCurrency(cartTotal);

  // Show or hide the delivery fee depending on the delivery option selected
  if (deliveryOption === "delivery") {
    cartDeliveryFeeElement.textContent = "+ R$ 2,00 de entrega";
    cartDeliveryFeeElement.style.display = "block";
  } else {
    cartDeliveryFeeElement.style.display = "none";
  }

  cartTotalElement.textContent = `Total: ${formattedTotal}`;
}


// Função para atualizar a lista de itens no carrinho exibida na página
function updateCartItems() {
  const cartItemsList = document.getElementById("cartItems");
  cartItemsList.innerHTML = ""; // Limpa a lista antes de preencher novamente

  cartItems.forEach((item, index) => {
    const cartItemElement = document.createElement("li");
    cartItemElement.textContent = `${item.name} - R$ ${item.price.toFixed(2)} `;

    // Adiciona um campo de input para o cliente escolher a quantidade
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.max = item.stock.toString();
    quantityInput.value = item.quantity.toString();
    quantityInput.addEventListener("input", (event) => {
      const newQuantity = parseInt(event.target.value);
      if (!isNaN(newQuantity) && newQuantity >= 1 && newQuantity <= item.stock) {
        cartItems[index].quantity = newQuantity;
        updateCartItems(); // Atualiza a exibição do carrinho ao alterar a quantidade
        updateCartTotal(); // Atualiza o total do carrinho na página
      }
    });

    cartItemElement.appendChild(quantityInput); // Adiciona o campo de input ao item do carrinho

    const removeButton = createRemoveButton(index); // Cria o botão de remoção
    cartItemElement.appendChild(removeButton); // Adiciona o botão ao item do carrinho

    cartItemElement.className = "cartItem";
    cartItemsList.appendChild(cartItemElement);
  });
}

function updateCartTotal() {
  const cartTotalElement = document.getElementById("cartTotal");
  const cartDeliveryFeeElement = document.getElementById("cartDeliveryFee");

  const cartTotal = calculateTotal();
  const formattedTotal = formatCurrency(cartTotal);

  // Mostrar ou ocultar a taxa de entrega dependendo da opção de entrega selecionada
  if (deliveryOption === "delivery") {
    cartDeliveryFeeElement.textContent = "+ R$ 2,00 de entrega";
    cartDeliveryFeeElement.style.display = "block";
  } else {
    cartDeliveryFeeElement.style.display = "none";
  }

  cartTotalElement.textContent = `Total: ${formattedTotal}`;
}

function clearCart() {
  cartItems.length = 0; // Esvazia o array de itens do carrinho
  updateCartItems(); // Atualiza a exibição do carrinho na página
  updateFinalizarButton(); // Atualiza o estado do botão "Finalizar Compra"
  updateCartTotal(); // Atualiza o total do carrinho na página após limpar o carrinho
}






  // Função para retornar os itens do carrinho como uma string formatada
  function getCartItemsAsString() {
    return cartItems.map(item => `${item.name} - R$ ${item.price.toFixed(2)}`).join('\n');
  }
  
  // Aplicar cores personalizadas
function applyCustomColors() {
  const unsubscribe = firestore.collection('config').doc('colors')
    .onSnapshot((doc) => {
      if (doc.exists) {
        const colors = doc.data();
        
        // Aplicar cores na loja virtual
        document.querySelector('header').style.backgroundColor = colors.header;
        document.querySelector('.cart-icon').style.color = colors.cart;
        document.querySelector('.promo-text').style.color = colors.promo;
        
        // Aplicar cor ou gradiente no body e footer
        document.body.style.background = colors.body;
        document.querySelector('footer').style.background = colors.footer;
      }
    });

  return unsubscribe; // Para parar de ouvir quando não for mais necessário
}

// Iniciar
let stopListening;
document.addEventListener('DOMContentLoaded', () => {
  stopListening = applyCustomColors();
});

// Opcional: Parar de ouvir quando sair da página
window.addEventListener('beforeunload', () => {
  if (stopListening) stopListening();
});



// Aplicar categorias personalizadas
function applyCustomCategories() {
  const unsubscribe = firestore.collection('config').doc('categories')
    .onSnapshot((doc) => {
      if (doc.exists) {
        const categories = doc.data();
        
        document.getElementById('catBtn1').textContent = categories.cat1;
        document.getElementById('catBtn2').textContent = categories.cat2;
        document.getElementById('catBtn3').textContent = categories.cat3;
        document.getElementById('catBtn4').textContent = categories.cat4;
        document.getElementById('catBtn5').textContent = categories.cat5;
      }
    });

  return unsubscribe; // Para parar de ouvir quando não for mais necessário
}

// Iniciar
let stopListeningCategories;
document.addEventListener('DOMContentLoaded', () => {
  stopListeningCategories = applyCustomCategories();
});

// Parar de ouvir quando sair da página
window.addEventListener('beforeunload', () => {
  if (stopListeningCategories) stopListeningCategories();
});
// Aplicar estilos nos botões das categorias
function applyButtonStyles() {
  const unsubscribe = firestore.collection('config').doc('categoryStyle')
    .onSnapshot((doc) => {
      if (doc.exists) {
        const styles = doc.data();
        
        // Aplicar estilos em todos os botões da categoria
        document.querySelectorAll('.category-button').forEach(button => {
          button.style.backgroundColor = styles.buttonColor;
          button.style.color = styles.textColor;
        });
      }
    });

  return unsubscribe; // Para parar de ouvir quando não for mais necessário
}

// Iniciar
let stopListeningButtonStyles;
document.addEventListener('DOMContentLoaded', () => {
  stopListeningButtonStyles = applyButtonStyles();
});

// Parar de ouvir quando sair da página
window.addEventListener('beforeunload', () => {
  if (stopListeningButtonStyles) stopListeningButtonStyles();
});


// Envie mensagens para o simulador
window.parent.postMessage('SCROLL_TOP', '*');

// Receba mensagens do simulador
window.addEventListener('message', (e) => {
    if(e.data === 'REFRESH') {
        window.location.reload();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const menu = document.querySelector(".menu-nav");
    const menuToggle = document.getElementById("menuToggle");

    menuToggle.addEventListener("click", function () {
        menu.classList.toggle("open");
    });
});
