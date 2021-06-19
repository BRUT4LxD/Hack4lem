let style = document.createElement('style');
style.type='text/css';
document.body.appendChild(style);
style.innerText = `.hate-input { background-color: 'red' !important }`

browser.storage.onChanged.addListener((changes, area) => {
    if (area == 'local' && 'value' in changes) {
        update(changes.value.newValue);
    }
});

function update(value) {
    style.innerText = `html { filter: sepia(${value}%) !important }`;
}

browser.storage.local.get('value').then(result => update(result.value));

function debounce(func, timeout = 300){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

let inputs = document.querySelectorAll('input[type=text]');
inputs.forEach(input => {
    input.addEventListener('input', debounce(function (evt) {
        console.log('INPUT CHANGE', input.value)

        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'https://a3734e843d35.ngrok.io/detect/hate', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            text: input.value
        }));

        xhr.onload = function () {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200) {
                    const sentiment = xhr.responseText;
                    console.log('Sentiment: ', sentiment)
                    if (sentiment < -2) {
                        style.innerText = `.hate-input { background-color: 'red' !important }`
                        console.log('Adding hate-input style');
                        input.classList.add('hate-input');
                    } else {
                        console.log('Removing hate-input style');
                        input.classList.remove('hate-input');
                    }
                }
            }
        };

    }));
    input.style.border = '5px red solid';
});