const assert = require('assert');
const { Builder, Browser, By, until } = require('selenium-webdriver');

// Инициализация драйвера для браузера Chrome
let driver = new Builder().forBrowser(Browser.CHROME).build();

// Начальные значения для общего количества и оставшихся элементов
let total = 5;
let remaining = 5;

// Функция для получения текста оставшихся элементов
async function fetchRemainingText() {
    let remainingElem = await driver.findElement(By.xpath("//span[@class='ng-binding']"));
    return remainingElem.getText();
}

// Функция для проверки текста оставшихся элементов
async function assertRemainingText(expectedRemaining, expectedTotal) {
    let text = await fetchRemainingText();
    let expectedText = `${expectedRemaining} of ${expectedTotal} remaining`;
    assert.equal(text, expectedText, "Текст оставшихся элементов не совпадает");
}

// Функция для проверки класса элемента списка
async function assertItemClass(index, expectedClass) {
    let item = await driver.findElement(By.xpath(`//input[@name='li${index}']/following-sibling::span`));
    let itemClass = await item.getAttribute("class");
    assert.equal(itemClass, expectedClass, `Элемент ${index} имеет класс ${itemClass}, а ожидался ${expectedClass}`);
}

// Функция для клика по элементу списка
async function clickListItem(index) {
    await driver.findElement(By.name("li" + index)).click();
}

// Функция для добавления нового элемента списка
async function addListItem(text) {
    await driver.findElement(By.id("sampletodotext")).sendKeys(text);
    await driver.findElement(By.id("addbutton")).click();
}

// Основная тестовая функция
async function lambdaTest() {
    try {
        // Открытие страницы и максимизация окна браузера
        await driver.get('https://lambdatest.github.io/sample-todo-app/');
        await driver.manage().window().maximize();

        // Шаг 1: Проверка заголовка страницы
        await driver.wait(until.elementLocated(By.css('h2')));
        let title = await driver.findElement(By.css('h2'));
        let isTitleDisplayed = await title.isDisplayed();
        assert.ok(isTitleDisplayed, "Заголовок не отображается");

        await driver.sleep(1000); // Небольшая пауза для визуализации

        for (let i = 1; i <= total; i++) {
            // Шаг 2: Проверка текста оставшихся элементов
            await assertRemainingText(remaining, total);

            // Шаг 3: Проверка, что элемент не зачеркнут
            await assertItemClass(i, "done-false");

            // Сохранение текущего значения remaining
            let previousRemaining = remaining;

            // Шаг 4: Установка галочки на элементе
            await clickListItem(i);
            remaining--;

            await driver.sleep(1000); // Небольшая пауза для визуализации

            // Проверка, что элемент стал зачеркнутым
            await assertItemClass(i, "done-true");

            // Проверка обновленного текста оставшихся элементов
            await assertRemainingText(remaining, total);

            // Проверка уменьшения remaining на 1
            assert.equal(remaining, previousRemaining - 1, "Количество оставшихся элементов не уменьшилось на 1");
        }

        // Сохранение текущих значений перед добавлением нового элемента
        let previousTotal = total;
        let previousRemaining = remaining;

        // Шаг 6: Добавление нового элемента списка
        await addListItem("New Item");
        total++;
        remaining++;

        await driver.sleep(1000); // Небольшая пауза для визуализации

        // Проверка нового элемента
        await assertItemClass(6, "done-false");

        // Проверка увеличения remaining и total на 1
        await assertRemainingText(remaining, total);
        assert.equal(remaining, previousRemaining + 1, "Количество оставшихся элементов не увеличилось на 1 после добавления нового элемента");
        assert.equal(total, previousTotal + 1, "Общее количество элементов не увеличилось на 1 после добавления нового элемента");

        // Шаг 7: Клик на новый элемент списка
        await clickListItem(6);
        remaining--;

        await driver.sleep(1000); // Небольшая пауза для визуализации

        // Проверка, что новый элемент стал зачеркнутым
        await assertItemClass(6, "done-true");

        // Проверка обновленного текста оставшихся элементов
        await assertRemainingText(remaining, total);
        assert.equal(remaining, previousRemaining, "Количество оставшихся элементов не уменьшилось на 1 после зачёркивания нового элемента");

        await driver.sleep(3000); // Завершающая пауза
    } catch (err) {
        // Сохранение скриншота при ошибке
        await driver.takeScreenshot().then(function (image) {
            require("fs").writeFileSync("screenshot_error.png", image, 'base64');
        });
        console.error('Тест завершился с ошибкой: %s', err);
    } finally {
        // Завершение работы драйвера
        await driver.quit();
    }
}

lambdaTest();
