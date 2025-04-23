const totalSummHeader = document.querySelector('.total_summ_header span')

const savingRange = document.querySelector('.saving_range');
const savingRangeAmount = document.querySelector('.saving_range_amount span');

if(localStorage.getItem('savingRange')) {
    const amount = localStorage.getItem('savingRange');
    savingRange.value = amount
    savingRangeAmount.innerText = amount
}

savingRange.addEventListener('input', () => {
    savingRangeAmount.innerText = savingRange.value
    localStorage.setItem('savingRange', savingRange.value)
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


let arrayIncomes = []; // массив с доходами
let arrayCosts = []; // массив с расходами
let arrayRegularCosts = []; // массив с постоянными расходами


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

    randerRegularCosts();

    selectRegularCategory.value = 'choice';
    inputRegularAmount.value = '';
    inputRegularDate.value = '';

})



/** 
 * редактирование записи дохода за месяц
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

            arrayIncomes = arrayIncomes.map(item => {
                if (item.id == id) {
                    item.category = category.innerText.trim();
                    item.amount = amount.innerText.trim();
                    item.date = date.innerText.trim();
                }
                return item;
            });

            randerIncomes(); // Перерисовка записей
        }

        step = !step;
    });
}



/**
 * редактирование записи расхода за день
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

            arrayCosts = arrayCosts.map(item => {
                if (item.id == id) {
                    item.category = category.innerText.trim();
                    item.amount = amount.innerText.trim();
                    item.date = date.innerText.trim();
                }
                return item;
            });

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

            arrayRegularCosts = arrayRegularCosts.map(item => {
                if (item.id == id) {
                    item.category = category.innerText.trim();
                    item.amount = amount.innerText.trim();
                    item.date = date.innerText.trim();
                }
                return item;
            });

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

        arrayIncomes = arrayIncomes.filter(item => {
            if(item.id != id) {
                return item
            }
        })

        randerIncomes();
    })
}


/**
 * удаление записи расхода за день
 */

function deleteCosts(button) {
    button.addEventListener('click', () => {
        const question = confirm('Вы действительно хотите удалить доход?');
        if(!question) return

        const id = button.dataset.id

        arrayCosts = arrayCosts.filter(item => {
            if(item.id != id) {
                return item
            }
        })

        randerCosts();
    })
}

/**
 * удаление записи регулярного расхода за месяц
 */
function deleteRegularCosts(button) {
    button.addEventListener('click', () => {
        const question = confirm('Вы действительно хотите удалить доход?');
        if(!question) return

        const id = button.dataset.id

        arrayRegularCosts = arrayRegularCosts.filter(item => {
            if(item.id != id) {
                return item
            }
        })

        randerRegularCosts(); // Перерисовка записей
    })
}




// 
function calcDailyBudget() {

    let incomes = 0;
    arrayIncomes.forEach(item => {
        incomes = incomes + +item.amount
    })

    let costs = 0;
    arrayCosts.forEach(item => {
        costs = costs + +item.amount
    })
    
    let regularCosts = 0;
    arrayRegularCosts.forEach(item => {
        regularCosts = regularCosts + +item.amount;
    })

    const sum = incomes - costs - regularCosts;

    const currentDate = new Date();
    const day = currentDate.getDate();
    const countDaysMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

    const numberDaysRemaining = countDaysMonth - day;
    
    const result = sum / numberDaysRemaining;

    totalSummHeader.innerText = result.toFixed(0) <= 0 ? 0 : result.toFixed(0);

    console.log('incomes - ', incomes);
    console.log('costs - ', costs);
    console.log('regularCosts - ', regularCosts);
    console.log('sum - ', sum);
    console.log('numberDaysRemaining - ', numberDaysRemaining);
    console.log('day - ', day);
    console.log('countDaysMonth - ', countDaysMonth);
    console.log('result.toFixed(0) - ', result.toFixed(0));
    
} 

/**
 * Функция рендера дохода за месяц
 */

function randerIncomes() {
    containerIncomes.innerHTML = '';

    arrayIncomes.forEach(item => {
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

    arrayCosts.forEach(item => {
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

    arrayRegularCosts.forEach(item => {
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


// let categoryProfits = document.querySelector('.category_text_profits');
// let amountProfits = document.querySelector('.amount_text_profits');
// let dateProfits = document.querySelector('.date_text_profits');
// let removeProfits = document.querySelector('.ti-trash');
// let buttonAddProfits = document.querySelector('.button_add');


// removeProfits.addEventListener('click', function() {
//     const rowToRemove = this.closest('.row');
//     if (rowToRemove) {
//         rowToRemove.remove();
//     }
// });


// buttonAddProfits.addEventListener('click', (e) => {

//     e.preventDefault();

//     const newRow = createTag('div', 'row');

//     // Создаём метку и поле для категории
//     const categoryLabel = createTag('label', 'text', 'Категория:');
//     const categoryTextProfits = createTag('input', 'category_text_profits', null, [
//         {type: 'category', value: 'text'},
//         {type: 'placeholder', value: 'Введите категорию'}
//     ]);

//     // Создаём метку и поле для суммы
//     const amountLabel = createTag('label', 'text', 'Сумма:');
//     const amountTextProfits = createTag('input', 'amount_text_profits', null, [
//         {name: 'category', value: 'number'},
//         {name: 'placeholder', value: 'Введите сумму'}
//     ]);

//     // Создаём метку и поле для даты
//     const dateLabel = createTag('label', 'text', 'Дата:');
//     const dateTextProfits = createTag('input', 'date_text_profits');
//     dateTextProfits.type = 'date';

//     // Создаём иконку удаления
//     const deleteProfits = createTag('i', ['ti', 'ti-trash']);
//     deleteProfits.style.cursor = 'pointer';

//     deleteProfits.addEventListener('click', () => {
//         newRow.remove()
//     })

//     // Создаём группу для категории
//     const row1 = createTag('div', 'col-3');
//     // Добавляем все элементы в группу категории
//     row1.append(categoryLabel, categoryTextProfits);

//     // Создаём группу для суммы
//     const row2 = createTag('div', 'col-3');
//     // Добавляем все элементы в группу суммы
//     row2.append(amountLabel, amountTextProfits);
    
//     // Создаём группу для даты
//     const row3 = createTag('div', 'col-3');
//     // Добавляем все элементы в группу дата
//     row3.append(dateLabel, dateTextProfits)

//     // Создаём группу для удаления
//     const row4 = createTag('div', 'col-3');
//     // Добавляем все элементы в группу удаления
//     row4.append(deleteProfits)
    
//     newRow.append(row1, row2, row3, row4);

//     // Добавляем группу в контейнер
//     document.querySelector('.profits').insertBefore(newRow, buttonAddProfits);
// });






