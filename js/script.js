const totalSummHeader = document.querySelector('.total_summ_header span')

const totalSummAccumulationYear = document.querySelector('.total_summ_accumulation_year span')

const savingRange = document.querySelector('.saving_range');
const savingRangeAmount = document.querySelector('.saving_range_amount span');

/*
    Возвращает возвращает куки с указанным name
    
        name - имя куки
*/
function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

/*
    Тема 
*/
const switchThema = document.querySelector('.switch');
switchThema.addEventListener('click', () => {
    switchThema.classList.toggle('active');
    document.body.classList.toggle('light');
    const timeCookie = switchThema.classList.contains('active') ? 3600 * 24 * 7 : 0;
    document.cookie = 'theme=light; max-age=' + timeCookie;
});

if(getCookie('theme')) {
    switchThema.classList.add('active');
    document.body.classList.add('light');
}


if(localStorage.getItem('savingRange')) {
    const amount = localStorage.getItem('savingRange');
    savingRange.value = amount
    savingRangeAmount.innerText = amount
}

savingRange.addEventListener('input', () => {
    savingRangeAmount.innerText = savingRange.value
    localStorage.setItem('savingRange', savingRange.value)

    calcDailyBudget()
})



/** 
 * Доход за месяц
 */
const containerIncomes = document.querySelector('.incomes');
const buttonAddIncome = document.querySelector('.button_add_income');

const inputIncomeCategory = document.querySelector('.section_incomes .category_text_profits');
const inputIncomeAmount = document.querySelector('.section_incomes .amount_text_profits');
const inputIncomeDate = document.querySelector('.section_incomes .date_text_profits');


/** 
 * Расход за день
 */
const containerCosts = document.querySelector('.waste');
const buttonAddSpend = document.querySelector('.button_add_spend');

const inputSpendCategory = document.querySelector('.all_spends .category_text_spends');
const inputSpendAmount = document.querySelector('.all_spends .amount_text_spends');
const inputSpendDate = document.querySelector('.all_spends .date_text_spends')


/** 
 * Регулярный расход
 */
const containerRegularWaste = document.querySelector('.regular_waste');
const buttonAddRegularWaste = document.querySelector('.button_add_regular_waste');

const selectRegularCategory = document.querySelector('.regular_spends .regular_category');
const inputRegularAmount = document.querySelector('.regular_spends .regular_amount');
const inputRegularDate = document.querySelector('.regular_spends .regular_date');


let arrayIncomes = localStorage.getItem('incomes') ? JSON.parse(localStorage.getItem('incomes')) : []; // массив с доходами
let arrayCosts = localStorage.getItem('costs') ? JSON.parse(localStorage.getItem('costs')) : []; // массив с расходами
let arrayRegularCosts = localStorage.getItem('regularCosts') ? JSON.parse(localStorage.getItem('regularCosts')) : []; // массив с постоянными расходами

randerCosts();
randerIncomes();
randerRegularCosts();

/** 
 * Добавить доход за месяц
 */

buttonAddIncome.addEventListener('click', () => {
    if(!inputIncomeCategory.value || !inputIncomeAmount.value || !inputIncomeDate.value) {
        return alert('Заполните все поля');
    }

    const incomeObj = {
        id: Date.now() + (Math.random() * 50).toFixed(), 
        category: inputIncomeCategory.value,
        amount: inputIncomeAmount.value,
        date: inputIncomeDate.value
    }

    arrayIncomes.push(incomeObj)

    localStorage.setItem('incomes', JSON.stringify(arrayIncomes))

    randerIncomes();

    inputIncomeCategory.value = ''
    inputIncomeAmount.value = ''
    inputIncomeDate.value = ''
})


/** 
 * Добавить расход за день
 */

buttonAddSpend.addEventListener('click', () => {
    if(!inputSpendCategory.value || !inputSpendAmount.value || !inputSpendDate.value) {
        return alert('Заполните все поля');
    }

    const costsObj = {
        id: Date.now() + (Math.random() * 50).toFixed(), 
        category: inputSpendCategory.value,
        amount: inputSpendAmount.value,
        date: inputSpendDate.value
    }

    arrayCosts.push(costsObj)

    localStorage.setItem('costs', JSON.stringify(arrayCosts))

    randerCosts();

    inputSpendCategory.value = ''
    inputSpendAmount.value = ''
    inputSpendDate.value = ''
})


/** 
 * Добавить регулярный расход за месяц
 */
buttonAddRegularWaste.addEventListener('click', () => {
    if(!selectRegularCategory.value || !inputRegularAmount.value || !inputRegularDate.value) {
        return alert('Заполните все поля');
    }

    const regularCostsObj = {
        id: Date.now() + (Math.random() * 50).toFixed(), 
        category: selectRegularCategory.value,
        amount: inputRegularAmount.value,
        date: inputRegularDate.value
    }

    arrayRegularCosts.push(regularCostsObj)

    localStorage.setItem('regularCosts', JSON.stringify(arrayRegularCosts))
    
    randerRegularCosts();

    selectRegularCategory.value = 'choice';
    inputRegularAmount.value = '';
    inputRegularDate.value = '';

})



/** 
 * редактирование записи дохода за месяц
 * 
 * дополнить!!!
 */

function updateIncome(button, category, amount, date) {
    let step = true;

    button.addEventListener('click', () => {
        if (step) {
            // Переключаем в режим редактирования
            category.setAttribute('contenteditable', 'true');
            amount.setAttribute('contenteditable', 'true');
            date.setAttribute('contenteditable', 'true');

            category.focus(); // ставим фокус на первое поле
            button.innerHTML = `<i class="ti ti-device-floppy"></i>`; // Иконка "сохранить"
        } else {
            // Сохраняем данные и выключаем редактирование
            category.removeAttribute('contenteditable');
            amount.removeAttribute('contenteditable');
            date.removeAttribute('contenteditable');

            const id = button.dataset.id;

            const data = JSON.parse(localStorage.getItem('incomes'))

            const newData = data.map(item => {
                if (item.id == id) {
                    item.category = category.innerText.trim();
                    item.amount = amount.innerText.trim();
                    item.date = date.innerText.trim();
                }
                return item;
            });

            localStorage.setItem('incomes', JSON.stringify(newData))


            randerIncomes(); // Перерисовка записей
        }

        step = !step;
    });
}



/**
 * редактирование записи расхода за день
 * 
 * 
 */

function updateCosts(button, category, amount, date) {
    let step = true;

    button.addEventListener('click', () => {
        if (step) {
            // Переключаем в режим редактирования
            category.setAttribute('contenteditable', 'true');
            amount.setAttribute('contenteditable', 'true');
            date.setAttribute('contenteditable', 'true');

            category.focus(); // ставим фокус на первое поле
            button.innerHTML = `<i class="ti ti-device-floppy"></i>`; // Иконка "сохранить"
        } else {
            // Сохраняем данные и выключаем редактирование
            category.removeAttribute('contenteditable');
            amount.removeAttribute('contenteditable');
            date.removeAttribute('contenteditable');

            const id = button.dataset.id;

            const data = JSON.parse(localStorage.getItem('costs'))

            const newData = data.map(item => {
                if (item.id == id) {
                    item.category = category.innerText.trim();
                    item.amount = amount.innerText.trim();
                    item.date = date.innerText.trim();
                }
                return item;
            });

            localStorage.setItem('costs', JSON.stringify(newData))

            randerIncomes(); // Перерисовка записей
        }

        step = !step;
    });
}


/**
 * редактирование записи регулярного расхода за месяц
 */
function updateRegularCosts(button, category, amount, date) {
    let step = true;

    button.addEventListener('click', () => {
        if (step) {
            // Переключаем в режим редактирования
            category.setAttribute('contenteditable', 'true');
            amount.setAttribute('contenteditable', 'true');
            date.setAttribute('contenteditable', 'true');

            category.focus(); // ставим фокус на первое поле
            button.innerHTML = `<i class="ti ti-device-floppy"></i>`; // Иконка "сохранить"
        } else {
            // Сохраняем данные и выключаем редактирование
            category.removeAttribute('contenteditable');
            amount.removeAttribute('contenteditable');
            date.removeAttribute('contenteditable');

            const id = button.dataset.id;

            const data = JSON.parse(localStorage.getItem('costs'))

            const newData = data.map(item => {
                if (item.id == id) {
                    item.category = category.innerText.trim();
                    item.amount = amount.innerText.trim();
                    item.date = date.innerText.trim();
                }
                return item;
            });

            localStorage.setItem('regularCosts', JSON.stringify(newData))

            randerRegularCosts(); // Перерисовка записей
        }

        step = !step;
    });
}


/**
 * удаление записи дохода за месяц
 */

function deleteIncome(button) {
    button.addEventListener('click', () => {
        const question = confirm('Вы действительно хотите удалить доход?');
        if(!question) return

        const id = button.dataset.id

        const data = JSON.parse(localStorage.getItem('incomes'))

        const newData = data.filter(item => {
            if(item.id != id) {
                return item
            }
        })

        localStorage.setItem('incomes', JSON.stringify(newData))

        randerIncomes();
    })
}


/**
 * удаление записи расхода за день
 */

function deleteCosts(button) {
    button.addEventListener('click', () => {
        const question = confirm('Вы действительно хотите удалить расход?');
        if(!question) return

        const id = button.dataset.id

        const data = JSON.parse(localStorage.getItem('costs'))

        const newData = data.filter(item => {
            if(item.id != id) {
                return item
            }
        })

        localStorage.setItem('costs', JSON.stringify(newData))

        randerCosts();
    })
}

/**
 * удаление записи регулярного расхода за месяц
 */
function deleteRegularCosts(button) {
    button.addEventListener('click', () => {
        const question = confirm('Вы действительно хотите удалить регулярный доход?');
        if(!question) return

        const id = button.dataset.id

        const data = JSON.parse(localStorage.getItem('regularCosts'))

        const newData = data.filter(item => {
            if(item.id != id) {
                return item
            }
        })

        localStorage.setItem('regularCosts', JSON.stringify(newData))

        randerRegularCosts(); // Перерисовка записей
    })
}




// 
function calcDailyBudget() {

    const savingRange = +localStorage.getItem('savingRange')

    // Подсчет общей суммы доходов
    let incomes = 0;
    arrayIncomes.forEach(item => {
        incomes = incomes + +item.amount
    })

    // Подсчет общей суммы расходов
    let costs = 0;
    arrayCosts.forEach(item => {
        costs = costs + +item.amount
    })
    
    // Подсчет общей суммы регулярных расходов
    let regularCosts = 0;
    arrayRegularCosts.forEach(item => {
        regularCosts = regularCosts + +item.amount;
    })

    // Расчет остатка после всех вычетов
    const sum = incomes - costs - regularCosts - savingRange;

    totalSummAccumulationYear.innerText = savingRange * 12;

    editAttrMaxInputRange(incomes - costs - regularCosts)


    // Расчет оставшихся дней в месяце
    const currentDate = new Date();
    const day = currentDate.getDate();
    const countDaysMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const numberDaysRemaining = countDaysMonth - day;
    

    // Расчет ежедневного бюджета
    const result = sum / numberDaysRemaining;
    totalSummHeader.innerText = result.toFixed(0) <= 0 ? 0 : result.toFixed(0);

} 

/**
 * Функция рендера дохода за месяц
 */

function randerIncomes() {
    containerIncomes.innerHTML = '';
    
    const data = localStorage.getItem('incomes') ? JSON.parse(localStorage.getItem('incomes')) : []

    data.forEach(item => {
        const divIncome = createTag('div', 'render_block')
        const category = createTag('div', 'costs_category', item.category)
        const amount = createTag('div', 'costs_amount', item.amount)
        const date = createTag('div', 'costs_date', item.date)
        const buttonUpdate = createTag('div', 'button_update', '<i class="ti ti-edit"></i>', [{name: 'data-id', value: item.id}])
        updateIncome(buttonUpdate, category, amount, date)

        const buttonDelete = createTag('div', 'button_delete', '<i class="ti ti-trash"></i>', [{name: 'data-id', value: item.id}])
        deleteIncome(buttonDelete)

        divIncome.append(category, amount, date, buttonUpdate, buttonDelete);
        containerIncomes.append(divIncome);
    })

    calcDailyBudget()
}


/**
 * Функция рендера расхода за день
 */

function randerCosts() {
    containerCosts.innerHTML = '';

    const data = localStorage.getItem('costs') ? JSON.parse(localStorage.getItem('costs')) : [];

    data.forEach(item => {
        const divCosts = createTag('div', 'render_block')
        const category = createTag('div', 'costs_category', item.category)
        const amount = createTag('div', 'costs_amount', item.amount)
        const date = createTag('div', 'costs_date', item.date)
        const buttonUpdate = createTag('div', 'button_update', '<i class="ti ti-edit"></i>', [{name: 'data-id', value: item.id}])
        updateCosts(buttonUpdate, category, amount, date)

        const buttonDelete = createTag('div', 'button_delete', '<i class="ti ti-trash"></i>', [{name: 'data-id', value: item.id}])
        deleteCosts(buttonDelete)

        divCosts.append(category, amount, date, buttonUpdate, buttonDelete);
        containerCosts.append(divCosts);
    })

    calcDailyBudget()
}


/**
 * Функция рендера регулярного расхода за месяц
 */


function randerRegularCosts() {
    containerRegularWaste.innerHTML = '';
    
    const data = localStorage.getItem('regularCosts') ? JSON.parse(localStorage.getItem('regularCosts')) : [];

    data.forEach(item => {
        const divRegularCosts = createTag('div', 'render_block')
        const category = createTag('div', 'costs_category', item.category)
        const amount = createTag('div', 'costs_amount', item.amount)
        const date = createTag('div', 'costs_date', item.date)
        const buttonUpdate = createTag('div', 'button_update', '<i class="ti ti-edit"></i>', [{name: 'data-id', value: item.id}])
        updateRegularCosts(buttonUpdate, category, amount, date)

        const buttonDelete = createTag('div', 'button_delete', '<i class="ti ti-trash"></i>', [{name: 'data-id', value: item.id}])
        deleteRegularCosts(buttonDelete)

        divRegularCosts.append(category, amount, date, buttonUpdate, buttonDelete);
        containerRegularWaste.append(divRegularCosts);
    })

    calcDailyBudget()
}






// Функция для создания тегов
function createTag(nameTag, classes, text, arrAttr) {
    const tag = document.createElement(nameTag || 'div');

    if (classes) {
        if (Array.isArray(classes)) {
            classes.forEach(name => tag.classList.add(name));
        } else {
            tag.classList.add(classes);
        }
    }
    if (text && nameTag !== 'input') tag.innerHTML = text;

    if(arrAttr) {
        arrAttr.forEach(attr => {
            tag.setAttribute(attr.name, attr.value)
        });
    }

    return tag;
}

/**
 * Функция корректировки макс. значения ползунка накоплений
 * @param {number} sum - Макс. допустимая сумма для установки
 */

function editAttrMaxInputRange(sum){
    if(savingRange.value > sum){
        savingRange.value = sum
        localStorage.setItem('savingRange', sum)
    }

    savingRange.setAttribute('max', sum)
}



