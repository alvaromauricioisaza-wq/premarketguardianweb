"use strict";

// Dirección del Worker de Premarket Guardian PRO.
const WORKER_BASE_URL =
    "https://premarket-guardian-license.alvaromauricioisaza.workers.dev";

document.addEventListener("DOMContentLoaded", initializePortal);

async function initializePortal() {
    const loadingState = document.getElementById("loading-state");
    const portalContent = document.getElementById("portal-content");
    const errorState = document.getElementById("error-state");
    const errorMessage = document.getElementById("error-message");

    try {
        const token = getAccessToken();

        if (!token) {
            showError(
                "El enlace de acceso está incompleto. No encontramos el token de tu compra."
            );

            return;
        }

        const response = await fetch(
            `${WORKER_BASE_URL}/portal/access?token=${encodeURIComponent(token)}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            }
        );

        const data = await readJsonSafely(response);

        if (!response.ok || !data?.success) {
            const message =
                data?.message ||
                "El enlace es inválido, fue revocado o no pertenece a una compra confirmada.";

            showError(message);
            return;
        }

        configurePortal(data, token);

        loadingState.classList.add("hidden");
        errorState.classList.add("hidden");
        portalContent.classList.remove("hidden");
    }
    catch (error) {
        console.error("Error al cargar el portal:", error);

        errorMessage.textContent =
            "No fue posible conectarse con el servidor. Intenta nuevamente en unos minutos.";

        loadingState.classList.add("hidden");
        portalContent.classList.add("hidden");
        errorState.classList.remove("hidden");
    }
}

function getAccessToken() {
    const parameters = new URLSearchParams(window.location.search);

    return String(parameters.get("token") ?? "").trim();
}

function configurePortal(data, token) {
    const customerName =
        String(data.customerName ?? "").trim();

    const licenseKey =
        String(data.licenseKey ?? "").trim();

    const productVersion =
        String(data.productVersion ?? "1.0.0").trim();

    const welcomeMessage =
        document.getElementById("welcome-message");

    const licenseKeyElement =
        document.getElementById("license-key");

    const productVersionElement =
        document.getElementById("product-version");

    const installerDownload =
        document.getElementById("installer-download");

    const manualDownload =
        document.getElementById("manual-download");

    if (customerName !== "") {
        welcomeMessage.textContent =
            `Hola ${customerName}. Gracias por adquirir Premarket Guardian PRO.`;
    }
    else {
        welcomeMessage.textContent =
            "Gracias por adquirir Premarket Guardian PRO.";
    }

    licenseKeyElement.textContent =
        licenseKey || "Licencia no disponible";

    productVersionElement.textContent =
        productVersion;

    installerDownload.href =
        `${WORKER_BASE_URL}/download/installer?token=${encodeURIComponent(token)}`;

    manualDownload.href =
        `${WORKER_BASE_URL}/download/manual?token=${encodeURIComponent(token)}`;

    installerDownload.addEventListener("click", event => {
        if (licenseKey === "") {
            event.preventDefault();

            showTemporaryMessage(
                "No se encontró una licencia asociada a esta compra.",
                true
            );
        }
    });

    manualDownload.addEventListener("click", event => {
        if (!token) {
            event.preventDefault();

            showTemporaryMessage(
                "El enlace de descarga no es válido.",
                true
            );
        }
    });

    configureCopyButton(licenseKey);
}

function configureCopyButton(licenseKey) {
    const copyButton =
        document.getElementById("copy-license-button");

    copyButton.addEventListener("click", async () => {
        if (!licenseKey) {
            showTemporaryMessage(
                "No hay una licencia disponible para copiar.",
                true
            );

            return;
        }

        try {
            await navigator.clipboard.writeText(licenseKey);

            showTemporaryMessage(
                "Licencia copiada correctamente.",
                false
            );

            copyButton.textContent = "Licencia copiada";

            window.setTimeout(() => {
                copyButton.textContent = "Copiar licencia";
            }, 2000);
        }
        catch {
            copyLicenseUsingFallback(licenseKey);
        }
    });
}

function copyLicenseUsingFallback(licenseKey) {
    const temporaryInput =
        document.createElement("textarea");

    temporaryInput.value = licenseKey;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    temporaryInput.style.pointerEvents = "none";

    document.body.appendChild(temporaryInput);

    temporaryInput.select();
    temporaryInput.setSelectionRange(
        0,
        temporaryInput.value.length
    );

    const copied =
        document.execCommand("copy");

    document.body.removeChild(temporaryInput);

    if (copied) {
        showTemporaryMessage(
            "Licencia copiada correctamente.",
            false
        );
    }
    else {
        showTemporaryMessage(
            "No fue posible copiar la licencia automáticamente.",
            true
        );
    }
}

function showTemporaryMessage(message, isError) {
    const copyMessage =
        document.getElementById("copy-message");

    copyMessage.textContent = message;

    copyMessage.style.color =
        isError ? "#ff8080" : "#55dd99";

    window.clearTimeout(
        showTemporaryMessage.timeoutId
    );

    showTemporaryMessage.timeoutId =
        window.setTimeout(() => {
            copyMessage.textContent = "";
        }, 3500);
}

function showError(message) {
    const loadingState =
        document.getElementById("loading-state");

    const portalContent =
        document.getElementById("portal-content");

    const errorState =
        document.getElementById("error-state");

    const errorMessage =
        document.getElementById("error-message");

    errorMessage.textContent = message;

    loadingState.classList.add("hidden");
    portalContent.classList.add("hidden");
    errorState.classList.remove("hidden");
}

async function readJsonSafely(response) {
    const responseText =
        await response.text();

    if (responseText.trim() === "") {
        return null;
    }

    try {
        return JSON.parse(responseText);
    }
    catch {
        return {
            success: false,
            message:
                "El servidor devolvió una respuesta que no se pudo interpretar."
        };
    }
}