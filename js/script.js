// =========================================================
// PAYPAL CHECKOUT - SANDBOX
// =========================================================

const PAYPAL_WORKER_URL =
    "https://premarket-guardian-license.alvaromauricioisaza.workers.dev";

let paypalCheckoutInitialized = false;

document.addEventListener("DOMContentLoaded", () => {
    const purchaseButtons = document.querySelectorAll(
        ".paypal-open-button"
    );

    purchaseButtons.forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.preventDefault();

            const checkoutSection =
                document.getElementById("paypal-checkout");

            if (!checkoutSection) {
                console.error(
                    "No se encontró la sección paypal-checkout."
                );
                return;
            }

            checkoutSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            if (!paypalCheckoutInitialized) {
                paypalCheckoutInitialized = true;

                try {
                    await initializePayPalCheckout();
                }
                catch (error) {
                    paypalCheckoutInitialized = false;
                    showPayPalError(error);
                }
            }
        });
    });
});


async function initializePayPalCheckout() {
    const loadingElement =
        document.getElementById("paypal-loading");

    const configResponse = await fetch(
        `${PAYPAL_WORKER_URL}/paypal/config`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const config = await configResponse.json();

    if (!configResponse.ok || !config.success) {
        throw new Error(
            config.message ||
            "No fue posible obtener la configuración de PayPal."
        );
    }

    await loadPayPalSdk(
        config.clientId,
        config.currency
    );

    if (loadingElement) {
        loadingElement.style.display = "none";
    }

    renderPayPalButtons();
}


function loadPayPalSdk(clientId, currency) {
    return new Promise((resolve, reject) => {
        if (window.paypal) {
            resolve();
            return;
        }

        const existingScript =
            document.getElementById("paypal-sdk-script");

        if (existingScript) {
            existingScript.addEventListener("load", resolve);
            existingScript.addEventListener("error", reject);
            return;
        }

        const script = document.createElement("script");

        script.id = "paypal-sdk-script";

        script.src =
            "https://www.paypal.com/sdk/js" +
            `?client-id=${encodeURIComponent(clientId)}` +
            `&currency=${encodeURIComponent(currency)}` +
            "&intent=capture" +
            "&components=buttons";

        script.onload = resolve;

        script.onerror = () => {
            reject(
                new Error(
                    "No fue posible cargar el sistema de pagos de PayPal."
                )
            );
        };

        document.head.appendChild(script);
    });
}


function renderPayPalButtons() {
    if (!window.paypal) {
        throw new Error(
            "El SDK de PayPal no está disponible."
        );
    }

    const container =
        document.getElementById("paypal-button-container");

    if (!container) {
        throw new Error(
            "No se encontró el contenedor del botón de PayPal."
        );
    }

    container.innerHTML = "";

    window.paypal.Buttons({
        style: {
            layout: "vertical",
            shape: "rect",
            label: "paypal",
            height: 48
        },

        createOrder: async () => {
            clearPayPalResult();

            const response = await fetch(
                `${PAYPAL_WORKER_URL}/paypal/create-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({})
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success || !data.orderID) {
                throw new Error(
                    data.message ||
                    "No fue posible crear la orden de PayPal."
                );
            }

            return data.orderID;
        },

        onApprove: async (data) => {
            showPayPalProcessing();

            const response = await fetch(
                `${PAYPAL_WORKER_URL}/paypal/capture-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        orderID: data.orderID
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "El pago fue aprobado, pero no pudo procesarse."
                );
            }

            showPayPalSuccess(result);
        },

        onCancel: () => {
            showPayPalMessage(
                "El pago fue cancelado. No se realizó ningún cobro.",
                false
            );
        },

        onError: (error) => {
            console.error(
                "Error de PayPal:",
                error
            );

            showPayPalError(error);
        }
    }).render("#paypal-button-container");
}


function showPayPalProcessing() {
    const resultElement =
        document.getElementById("paypal-result");

    if (!resultElement) {
        return;
    }

    resultElement.className = "";
    resultElement.textContent =
        "Pago aprobado. Estamos generando tu licencia...";
}


function showPayPalSuccess(result) {
    const resultElement =
        document.getElementById("paypal-result");

    if (!resultElement) {
        return;
    }

    const licenseKey =
        result.licenseKey || "Licencia generada";

    const customerEmail =
        result.customerEmail || "";

    resultElement.className =
        "paypal-success-message";

    resultElement.innerHTML = `
        <strong>¡Compra completada correctamente!</strong>
        <br><br>
        Tu licencia es:
        <br>
        <strong>${escapeHtml(licenseKey)}</strong>
        ${
            customerEmail
                ? `<br><br>Comprador: ${escapeHtml(customerEmail)}`
                : ""
        }
        <br><br>
        Guarda esta licencia en un lugar seguro.
    `;
}


function showPayPalError(error) {
    const message =
        error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado con PayPal.";

    showPayPalMessage(message, true);
}


function showPayPalMessage(message, isError) {
    const resultElement =
        document.getElementById("paypal-result");

    if (!resultElement) {
        return;
    }

    resultElement.className =
        isError
            ? "paypal-error-message"
            : "";

    resultElement.textContent = message;
}


function clearPayPalResult() {
    const resultElement =
        document.getElementById("paypal-result");

    if (!resultElement) {
        return;
    }

    resultElement.className = "";
    resultElement.textContent = "";
}


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}