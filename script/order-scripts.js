const API_KEY = 'e1fbaa81-9ffb-4d09-ac93-81cde44693e6'; 
const API_URL_DISHES = 'https://edu.std-900.ist.mospolytech.ru/labs/api/dishes';
const API_URL_ORDERS = `https://edu.std-900.ist.mospolytech.ru/labs/api/orders?api_key=${API_KEY}`;

const orderGrid = document.getElementById('order-items-grid');
const emptyMessage = document.getElementById('empty-message');
const orderForm = document.getElementById('order-form');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');
const notificationBtn = document.getElementById('notification-close');

const summaryElements = {
    soup: document.getElementById('summary-soup'),
    main: document.getElementById('summary-main'),
    starter: document.getElementById('summary-salad'),
    drink: document.getElementById('summary-drink'),
    dessert: document.getElementById('summary-dessert'),
    total: document.getElementById('summary-total-price')
};

let selectedDishes = JSON.parse(localStorage.getItem('selectedDishes')) || {};
let allDishes = [];

function init() {
    if (Object.keys(selectedDishes).length === 0) {
        showEmptyState();
        return;
    }
    fetch(API_URL_DISHES)
        .then(res => res.json())
        .then(data => {
            allDishes = data.map(d => ({
                ...d,
                category: d.category === 'main-course' ? 'main' :
                          d.category === 'salad' ? 'starter' : d.category
            }));
            renderOrder();
        })
        .catch(err => console.error(err));
    
    setupTimeInput();
}

function showEmptyState() {
    orderGrid.innerHTML = '';
    emptyMessage.classList.remove('hidden');
}

function getDishById(id) {
    return allDishes.find(d => String(d.id) === String(id));
}

function renderOrder() {
    orderGrid.innerHTML = '';
    let hasItems = false;
    let totalPrice = 0;

    for (let key in summaryElements) {
        if (key !== 'total') summaryElements[key].textContent = 'Не выбрано';
    }

    const displayOrder = ['soup', 'main', 'starter', 'drink', 'dessert'];

    displayOrder.forEach(cat => {
        const dishId = selectedDishes[cat];
        if (dishId) {
            const dish = getDishById(dishId);
            if (dish) {
                hasItems = true;
                totalPrice += dish.price;

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <img src="${dish.image}" alt="${dish.name}">
                    <div class="name">${dish.name}</div>
                    <div class="price">${dish.price} ₽</div>
                    <button type="button" style="background:#e0e0e0;">Удалить</button>
                `;
                
                card.querySelector('button').addEventListener('click', () => {
                    removeDish(cat);
                });

                orderGrid.appendChild(card);
                summaryElements[cat].textContent = `${dish.name} (${dish.price}₽)`;
            }
        }
    });

    summaryElements.total.textContent = `${totalPrice}₽`;

    if (!hasItems) showEmptyState();
    else emptyMessage.classList.add('hidden');
}

function removeDish(category) {
    delete selectedDishes[category];
    localStorage.setItem('selectedDishes', JSON.stringify(selectedDishes));
    renderOrder();
}

function setupTimeInput() {
    const radioNow = document.getElementById('time-now');
    const radioTime = document.getElementById('time-later');
    const timeContainer = document.getElementById('time-input-container');
    const timeInput = document.getElementById('delivery_time');

    radioNow.addEventListener('change', () => {
        timeContainer.classList.add('hidden');
        timeInput.required = false;
    });

    radioTime.addEventListener('change', () => {
        timeContainer.classList.remove('hidden');
        timeInput.required = true;
    });
}

function showNotification(msg) {
    notificationText.textContent = msg;
    notification.classList.remove('hidden');
}
notificationBtn.addEventListener('click', () => {
    notification.classList.add('hidden');
});

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!checkCombo(selectedDishes)) {
        showNotification("Состав заказа не соответствует комбо. Вернитесь в меню и добавьте блюда.");
        return;
    }

    const formData = new FormData(orderForm);
    const data = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        subscribe: formData.get('subscribe') ? 1 : 0,
        phone: formData.get('phone'),
        delivery_address: formData.get('delivery_address'),
        delivery_type: formData.get('delivery_type'),
        comment: formData.get('comment'),
        soup_id: selectedDishes.soup ? parseInt(selectedDishes.soup) : null,
        main_course_id: selectedDishes.main ? parseInt(selectedDishes.main) : null,
        salad_id: selectedDishes.starter ? parseInt(selectedDishes.starter) : null,
        drink_id: selectedDishes.drink ? parseInt(selectedDishes.drink) : null,
        dessert_id: selectedDishes.dessert ? parseInt(selectedDishes.dessert) : null,
    };

    if (formData.get('delivery_type') === 'by_time') {
        data.delivery_time = formData.get('delivery_time');
    }

    try {
        const response = await fetch(API_URL_ORDERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showNotification("Заказ успешно оформлен!");
            localStorage.removeItem('selectedDishes');
            selectedDishes = {};
            renderOrder();
            orderForm.reset();
        } else {
            const errorData = await response.json();
            showNotification(`Ошибка: ${errorData.error || 'Не удалось оформить заказ'}`);
        }
    } catch (error) {
        showNotification("Сетевая ошибка");
    }
});

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

init();