const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api/dishes';
const menuEl = document.getElementById("menu");
const navEl = document.getElementById("nav");
const footerEl = document.getElementById("sticky-footer");
const totalPriceEl = document.getElementById("total-price");
const orderLinkEl = document.getElementById("order-link");

let dishes = [];


let selectedDishes = JSON.parse(localStorage.getItem('selectedDishes')) || {};

function loadDishes() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            
            dishes = data.map(d => ({
                ...d,
                category: d.category === 'main-course' ? 'main' :
                          d.category === 'salad' ? 'starter' : d.category
            })).sort((a, b) => a.name.localeCompare(b.name));
            
            renderMenu();
            addNavListeners();
            updateStickyFooter(); 
        })
        .catch(error => console.error('Error loading dishes:', error));
}

function createCard(dish) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = dish.id;

    const isSelected = selectedDishes[dish.category] === String(dish.id);

    card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <div class="price">${dish.price} ₽</div>
        <div class="name">${dish.name}</div>
        <div class="weight">${dish.weight}</div>
        <button type="button" class="${isSelected ? 'added' : ''}">
            ${isSelected ? 'Добавлено' : 'Добавить'}
        </button>`;

    const btn = card.querySelector("button");
    btn.addEventListener("click", () => {
        handleDishSelection(dish);
    });

    return card;
}

function handleDishSelection(dish) {
    const category = dish.category;
    const currentId = String(dish.id);

    selectedDishes[category] = currentId;

    localStorage.setItem('selectedDishes', JSON.stringify(selectedDishes));

    updateButtonsUI(category, currentId);

    updateStickyFooter();
}

function updateButtonsUI(category, activeId) {
    const section = document.querySelector(`.menu-section[data-cat="${category}"]`);
    if(!section) return;

    const cards = section.querySelectorAll('.card');
    cards.forEach(card => {
        const btn = card.querySelector('button');
        if (String(card.dataset.id) === String(activeId)) {
            btn.textContent = "Добавлено";
            btn.classList.add('added');
        } else {
            btn.textContent = "Добавить";
            btn.classList.remove('added');
        }
    });
}

function renderMenu() {
    menuEl.innerHTML = "";
    const cats = ["main", "soup", "starter", "drink", "dessert"];
    
    cats.forEach((cat) => {
        const section = document.createElement("section");
        section.className = "menu-section";
        section.dataset.cat = cat;
        
        if (cat !== "main") section.classList.add("hidden");

        const container = document.createElement("div");
        container.className = "cards-row";
        
        dishes
            .filter((d) => d.category === cat)
            .forEach((d) => container.append(createCard(d)));

        if (container.children.length > 0) {
            section.append(container);
            menuEl.append(section);
        }
    });
}

function updateStickyFooter() {
    let total = 0;
    let count = 0;
    
    for (const [cat, id] of Object.entries(selectedDishes)) {
        const dish = dishes.find(d => String(d.id) === String(id));
        if (dish) {
            total += dish.price;
            count++;
        }
    }

    totalPriceEl.textContent = total;

    // Показываем панель, если что-то выбрано
    if (count === 0) {
        footerEl.classList.add('hidden');
    } else {
        footerEl.classList.remove('hidden');
    }

    // Проверка комбо (активация кнопки)
    if (checkCombo(selectedDishes)) {
        orderLinkEl.classList.remove('disabled');
    } else {
        orderLinkEl.classList.add('disabled');
    }
}

function checkCombo(selection) {
    const s = !!selection.soup;
    const m = !!selection.main;
    const st = !!selection.starter; 
    const d = !!selection.drink;

    if (s && m && st && d) return true;
    if (s && m && !st && d) return true;
    if (s && !m && st && d) return true;
    if (!s && m && st && d) return true;
    if (!s && m && !st && d) return true;

    return false;
}

function addNavListeners() {
    const navBtns = document.querySelectorAll("#nav button");
    navBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#nav button").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const cat = btn.dataset.cat;
            document.querySelectorAll(".menu-section").forEach((sec) => {
                if (sec.dataset.cat === cat) sec.classList.remove("hidden");
                else sec.classList.add("hidden");
            });
        });
    });
}

loadDishes();