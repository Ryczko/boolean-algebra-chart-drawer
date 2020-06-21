const checkBtn = document.querySelector('.checkBtn');
const resetBtn = document.querySelector('.resetBtn');
const expressionInput = document.querySelector('.expression');
const content = document.querySelector('.content');

const chartField = document.querySelector('.chart-field');
const errorField = document.querySelector('.error');
const resultField = document.querySelector('.result');
const resultArray = [];
const pLine = document.querySelector('.line.p');
const qLine = document.querySelector('.line.q');
const rLine = document.querySelector('.line.r');
const resultLine = document.querySelector('.line.result')


const variablesSymbols = ['p', 'P', 'q', 'Q', 'r', 'R', '1', '0'];
const operationSymbols = ['!', '+', '*', '='];
const otherSymbols = [' ', '(', ')', '[', ']'];
let expression = '';
let actualState = 0;
let interval = null;
const chart = document.querySelector('.chart')

expressionInput.addEventListener('input', function () {

    reset();
    if (expressionInput.value == "") checkBtn.disabled = true;
    else checkBtn.disabled = false;
    chartField.classList.remove('active')
    errorField.classList.remove('active')
    const lastSymbol = expressionInput.value[expressionInput.value.length - 1];
    const allSymbols = [...variablesSymbols, ...operationSymbols, ...otherSymbols]

    if (!allSymbols.includes(lastSymbol)) {
        expressionInput.value = expressionInput.value.slice(0, -1)
    }
})

checkBtn.addEventListener('click', checkTautology)
resetBtn.addEventListener('click', reset)

function reset() {
    pLine.innerHTML = '<div class="state-name">p</div>';
    qLine.innerHTML = '<div class="state-name">q</div>';
    rLine.innerHTML = '<div class="state-name">r</div>';
    resultLine.innerHTML = '<div class="state-name">y</div>';
    actualState = 0;
    clearInterval(interval);
    stopHandle();
}

function stopHandle() {
    clearInterval(interval);
    checkBtn.addEventListener('click', checkTautology);
    checkBtn.textContent = "Start"
}

function checkTautology() {
    checkBtn.removeEventListener('click', checkTautology);
    checkBtn.textContent = "Stop"
    pLine.style.display = 'flex'
    qLine.style.display = 'flex'
    rLine.style.display = 'flex'



    checkBtn.addEventListener('click', stopHandle)
    resultArray.length = 0;
    expression = expressionInput.value;
    expression = expression.replace(/ /g, '');
    expression = expression.replace(/\[/g, '(').replace(/\]/g, ')');
    expression = expression.replace(/P|Q|R/g, function (x) {
        return x.toLowerCase();
    });
    expression = expression.replace(/n|s|c|i|e/g, function (x) {
        return x.toUpperCase();
    });

    if (!expression) return;

    for (let i = 0; i < expression.length - 1; i++) {
        if (variablesSymbols.includes(expression[i]) && [...variablesSymbols, '(', '['].includes(expression[i + 1])) return errorField.classList.add('active')
    }


    expression = '(' + expression + ')';
    if (!expression.includes('p')) pLine.style.display = 'none'
    if (!expression.includes('q')) qLine.style.display = 'none'
    if (!expression.includes('r')) rLine.style.display = 'none'

    try {
        interval = setInterval(() => {
            let binary = (actualState >>> 0).toString(2);
            while (binary.length < 3) {
                binary = "0" + binary;
            }
            binary = binary.split('');
            try {
                const yState = combine(expression, binary[0], binary[1], binary[2]);
                buildChart(yState, resultLine);
                actualState++;
                if (actualState === 8) actualState = 0;
            }
            catch (e) {

                errorField.classList.add('active');
                clearInterval(interval)
                return
            };

        }, document.getElementById('time').value)
    }

    catch (e) {
        errorField.classList.add('active')
        return
    }


    resultArray.forEach(el => {
        buildChart(el, resultLine)
    })
    chartField.classList.add('active');
}

function buildChart(state, where) {
    const stateDiv = document.createElement('div');
    if (state == 1) {
        stateDiv.classList.add('state-one')
    } else {
        stateDiv.classList.add('state-null')
    }
    where.appendChild(stateDiv)
}

function combine(expression, p, q, r) {

    buildChart(p, pLine);
    buildChart(q, qLine);
    buildChart(r, rLine);


    const oryginalExpression = expression;
    expression = expression.replace(/p/gi, p).replace(/q/gi, q).replace(/r/gi, r);

    expression = getInternalPart(expression);

    return expression;

}

function getInternalPart(expression) {

    const numberOfLoop = expression.split('(').length - 1;

    for (let i = 0; i < numberOfLoop; i++) {

        let openedBracket = expression.lastIndexOf('(');
        let closedBracket = expression.indexOf(')', openedBracket) + 1;
        let fragment = expression.slice(openedBracket, closedBracket);
        fragment = negation(fragment);
        fragment = productOrSum(fragment, 'product');
        fragment = productOrSum(fragment, 'sum')
        fragment = equivalence(fragment);

        fragment = fragment[1];
        expression = expression.slice(0, openedBracket) + fragment + expression.slice(closedBracket)
    }
    return expression
}


function negation(fragment) {
    let negativeIndex = fragment.indexOf('!')
    while (negativeIndex !== -1) {
        const negativeValue = fragment[negativeIndex] + fragment[negativeIndex + 1];
        const negativeValueNumber = +(eval(negativeValue));
        fragment = fragment.slice(0, negativeIndex) + negativeValueNumber + fragment.slice(negativeIndex + 2)

        negativeIndex = fragment.indexOf('!')
    }
    return fragment;
}


function productOrSum(fragment, type) {
    let productIndex = (type === "sum") ? fragment.indexOf('+') : fragment.indexOf('*')
    while (productIndex !== -1) {
        fragment = (type === "sum") ? fragment.replace('+', '|') : fragment.replace('*', '&');
        const value = fragment.slice(productIndex - 1, productIndex + 2);

        const transformedValue = +(eval(value));
        fragment = fragment.slice(0, productIndex - 1) + transformedValue + fragment.slice(productIndex + 2);

        productIndex = (type === "sum") ? fragment.indexOf('+') : fragment.indexOf('*')

    }
    return (fragment)
}



function equivalence(fragment) {

    let equivalenceIndex = fragment.indexOf('=')

    while (equivalenceIndex !== -1) {

        fragment = fragment.replace('=', '==');

        const value = fragment.slice(equivalenceIndex - 1, equivalenceIndex + 3);
        const transformedValue = +(eval(value));
        fragment = fragment.slice(0, equivalenceIndex - 1) + transformedValue + fragment.slice(equivalenceIndex + 3)

        equivalenceIndex = fragment.indexOf('=')
    }

    return (fragment)
}


function firstOnLeft(a, b, fragment) {
    const indexA = fragment.indexOf(a);
    const indexB = fragment.indexOf(b);
    if (indexA === -1 || (indexB < indexA && indexB !== -1)) return indexB;
    else if (indexB === -1 || (indexA < indexB && indexB !== -1)) return indexA;
}

