// =========================================================
// PADDLE CHECKOUT - LIVE
// PREMARKET GUARDIAN PRO
// =========================================================

const PADDLE_CLIENT_TOKEN =
    "live_b8ce07d2a11566d5e98943432bd";

const PADDLE_PRICE_ID =
    "pri_01kzct4nb2z3ga3sh1p7kf6a5j";

let paddleInitialized = false;


// =========================================================
// INICIALIZAR AL CARGAR LA PÁGINA
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    initializePaddleCheckout();

    const purchaseButtons =
        document.querySelectorAll(".paddle-open-button");

    purchaseButtons.forEach((button) => {

        button.addEventListener("click", (event) => {

            event.preventDefault();

            openPaddleCheckout();

        });

    });

});


// =========================================================
// INICIALIZAR PADDLE.JS
// =========================================================

function initializePaddleCheckout() {

    if (paddleInitialized) {
        return;
    }

    if (!window.Paddle) {

        console.error(
            "Paddle.js no está disponible."
        );

        return;
    }

    try {

        Paddle.Initialize({

            token: PADDLE_CLIENT_TOKEN,

            eventCallback: function (event) {

                handlePaddleEvent(event);

            }

        });

        paddleInitialized = true;

        console.log(
            "Paddle Checkout inicializado correctamente."
        );

    }
    catch (error) {

        console.error(
            "No fue posible inicializar Paddle:",
            error
        );

    }

}


// =========================================================
// ABRIR CHECKOUT
// =========================================================

function openPaddleCheckout() {

    if (!window.Paddle) {

        alert(
            "El sistema de pagos todavía no está disponible. Intenta nuevamente en unos segundos."
        );

        return;
    }

    if (!paddleInitialized) {

        initializePaddleCheckout();

    }

    if (!paddleInitialized) {

        alert(
            "No fue posible iniciar el sistema de pagos. Intenta nuevamente."
        );

        return;
    }

    try {

        Paddle.Checkout.open({

            items: [
                {
                    priceId: PADDLE_PRICE_ID,
                    quantity: 1
                }
            ],

            settings: {

                displayMode: "overlay",

                theme: "dark",

                locale: "es"

            }

        });

    }
    catch (error) {

        console.error(
            "No fue posible abrir Paddle Checkout:",
            error
        );

        alert(
            "No fue posible abrir el pago seguro. Intenta nuevamente."
        );

    }

}


// =========================================================
// EVENTOS DEL CHECKOUT
// =========================================================

function handlePaddleEvent(event) {

    if (!event || !event.name) {
        return;
    }

    console.log(
        "Evento Paddle:",
        event.name,
        event
    );


    // -----------------------------------------------------
    // CHECKOUT ABIERTO
    // -----------------------------------------------------

    if (event.name === "checkout.loaded") {

        console.log(
            "Checkout de Premarket Guardian PRO abierto."
        );

        return;
    }


    // -----------------------------------------------------
    // PAGO COMPLETADO EN EL CHECKOUT
    // -----------------------------------------------------

    if (event.name === "checkout.completed") {

        console.log(
            "Compra completada en Paddle.",
            event
        );

        showPurchaseCompletedMessage();

        return;
    }


    // -----------------------------------------------------
    // CHECKOUT CERRADO
    // -----------------------------------------------------

    if (event.name === "checkout.closed") {

        console.log(
            "El cliente cerró Paddle Checkout."
        );

    }

}


// =========================================================
// MENSAJE DESPUÉS DEL CHECKOUT
// =========================================================

function showPurchaseCompletedMessage() {

    const message = document.createElement("div");

    message.id = "paddle-purchase-success";

    message.style.position = "fixed";
    message.style.left = "50%";
    message.style.top = "50%";
    message.style.transform = "translate(-50%, -50%)";
    message.style.zIndex = "999999";
    message.style.maxWidth = "520px";
    message.style.width = "calc(100% - 40px)";
    message.style.padding = "32px";
    message.style.borderRadius = "18px";
    message.style.background = "#0c1b31";
    message.style.border = "1px solid #2d65a5";
    message.style.boxShadow =
        "0 20px 60px rgba(0,0,0,.55)";
    message.style.color = "#ffffff";
    message.style.textAlign = "center";
    message.style.fontFamily =
        "Arial, Helvetica, sans-serif";

    message.innerHTML = `
        <div style="
            font-size:13px;
            font-weight:700;
            letter-spacing:1.5px;
            color:#58a6ff;
            margin-bottom:14px;
        ">
            PREMARKET GUARDIAN PRO
        </div>

        <h2 style="
            margin:0 0 16px;
            font-size:26px;
        ">
            ¡Compra completada!
        </h2>

        <p style="
            margin:0 0 12px;
            line-height:1.7;
            color:#d7e3f4;
        ">
            Tu pago fue procesado correctamente.
        </p>

        <p style="
            margin:0 0 24px;
            line-height:1.7;
            color:#d7e3f4;
        ">
            Estamos generando tu licencia de Premarket Guardian PRO.
            Recibirás por correo tu licencia y el acceso al portal
            de descargas.
        </p>

        <button
            id="paddle-success-close"
            type="button"
            style="
                border:0;
                border-radius:10px;
                padding:13px 24px;
                background:#2d8cff;
                color:#ffffff;
                font-size:15px;
                font-weight:700;
                cursor:pointer;
            "
        >
            Entendido
        </button>
    `;

    const existing =
        document.getElementById("paddle-purchase-success");

    if (existing) {
        existing.remove();
    }

    document.body.appendChild(message);

    const closeButton =
        document.getElementById("paddle-success-close");

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {
                message.remove();
            }
        );

    }

}