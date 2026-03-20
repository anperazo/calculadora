// Guardamos referencias del display para no buscarlas todo el tiempo.
let display = document.getElementById("display");
let expressionLine = document.getElementById("expressionLine");

// Si es true, lo ultimo que se mostro fue un resultado (despues de '=')
let mostrandoResultado = false;

// Escribe en pantalla lo que se va presionando.

function appendValue(value) {
  if (mostrandoResultado) {
    const esOperadorBinario = ["+", "-", "*", "/", "^"].includes(value);

    if (esOperadorBinario) {
      display.innerText += value;
    } else {
      display.innerText = value;
    }

    // Limpiamos la linea de arriba porque ya no estamos viendo "expresion =".
    expressionLine.innerText = "";
    mostrandoResultado = false;
  } else if (display.innerText === "0") {
    // Evita cosas como 05 o 02.
    display.innerText = value;
  } else {
    display.innerText += value;
  }
}

// Limpia todo y vuelve al estado inicial.
function clearDisplay() {
  display.innerText = "0";
  expressionLine.innerText = "";
  mostrandoResultado = false;
}

// ===== Conversiones (lo que el usuario ve -> lo que JS puede calcular) =====

// Raiz en doble modo:
// - Click en boton: agrega "√" al display.
// - En calculo: transforma la expresion para que eval funcione.
function hacerRaiz(expression) {
  if (typeof expression === "undefined") {
    appendValue("\u221A");
    return display.innerText;
  }

  // Ejemplos que resuelve:
  // 3√8      -> (8 ** (1 / 3))
  // 3√(x+1)  -> ((x+1) ** (1 / 3))
  // √9       -> (9 ** (1 / 2))
  return expression
    .replace(/(\d+(?:\.\d+)?)√\(([^)]+)\)/g, "(($2) ** (1 / $1))")
    .replace(/(\d+(?:\.\d+)?)√(\d+(?:\.\d+)?)/g, "($2 ** (1 / $1))")
    .replace(/√\(([^)]+)\)/g, "(($1) ** (1 / 2))")
    .replace(/√(\d+(?:\.\d+)?)/g, "($1 ** (1 / 2))");
}

// Potencia: en pantalla usamos ^, por dentro JS usa **.
function hacerPotencia(expression) {
  if (typeof expression === "undefined") {
    appendValue("^");
    return display.innerText;
  }

  return expression.replace(/\^/g, "**");
}

// log base 10.
function hacerLog(expression) {
  if (typeof expression === "undefined") {
    appendValue("log(");
    return display.innerText;
  }

  return expression.replace(/(^|[^.\w])log\(/g, "$1Math.log10(");
}

// ln (log natural).
function hacerLn(expression) {
  if (typeof expression === "undefined") {
    appendValue("ln(");
    return display.innerText;
  }

  return expression.replace(/(^|[^.\w])ln\(/g, "$1Math.log(");
}

// Porcentaje simple: 50% -> 0.5
function hacerPorcentaje(expression) {
  if (typeof expression === "undefined") {
    appendValue("%");
    return display.innerText;
  }

  return expression
    .replace(/(\d+(?:\.\d+)?)%/g, "($1 / 100)")
    .replace(/\(([^)]+)\)%/g, "(($1) / 100)");
}

// Trigonometricas en grados (JS trabaja en radianes, por eso la conversion).
function hacerSin(expression) {
  if (typeof expression === "undefined") {
    appendValue("sin(");
    return display.innerText;
  }

  return expression.replace(/(^|[^.\w])sin\(([^)]*)\)/g, "$1Math.sin(($2) * Math.PI / 180)");
}

// cos(x) con x en grados.
function hacerCos(expression) {
  if (typeof expression === "undefined") {
    appendValue("cos(");
    return display.innerText;
  }

  return expression.replace(/(^|[^.\w])cos\(([^)]*)\)/g, "$1Math.cos(($2) * Math.PI / 180)");
}

// tan(x) con x en grados.
function hacerTan(expression) {
  if (typeof expression === "undefined") {
    appendValue("tan(");
    return display.innerText;
  }

  return expression.replace(/(^|[^.\w])tan\(([^)]*)\)/g, "$1Math.tan(($2) * Math.PI / 180)");
}

// Valor absoluto.
function hacerAbs(expression) {
  if (typeof expression === "undefined") {
    appendValue("abs(");
    return display.innerText;
  }

  return expression.replace(/(^|[^.\w])abs\(/g, "$1Math.abs(");
}

// Aplica todas las conversiones una tras otra.
function prepararExpresion(expression) {
  const conversiones = [hacerRaiz, hacerPotencia, hacerLog, hacerLn, hacerPorcentaje, hacerSin, hacerCos, hacerTan, hacerAbs];
  return conversiones.reduce((expr, fn) => fn(expr), expression);
}

// Corre el '=': toma lo visible, lo traduce, evalua y actualiza pantalla + historial.
function calculateResult() {
  try {
    const expresionOriginal = display.innerText;
    const expression = prepararExpresion(expresionOriginal);
    let result = eval(expression);

    // Arriba dejamos la cuenta original, abajo el resultado.
    expressionLine.innerText = expresionOriginal + " =";
    display.innerText = result;
    mostrandoResultado = true;

    // Se guarda para poder reutilizarla luego desde historial.
    agregarAlHistorial(expresionOriginal, result);
  } catch (error) {
    // Si la expresion esta mal cerrada o invalida, mostramos Error.
    expressionLine.innerText = "";
    display.innerText = "Error";
    mostrandoResultado = false;
  }
}

// ===== Modales =====

// Abre ayuda.
function abrirAyuda() {
  document.getElementById("modalAyuda").classList.add("modal-visible");
}

// Abre historial.
function abrirHistorial() {
  document.getElementById("modalHistorial").classList.add("modal-visible");
}

// Cierra ayuda.
function cerrarAyuda() {
  document.getElementById("modalAyuda").classList.remove("modal-visible");
}

// Cierra historial.
function cerrarHistorial() {
  document.getElementById("modalHistorial").classList.remove("modal-visible");
}

// Si haces click fuera de la tarjeta de ayuda, se cierra.
function cerrarAyudaFondo(event) {
  if (event.target === document.getElementById("modalAyuda")) {
    cerrarAyuda();
  }
}

// Igual que arriba, pero para historial.
function cerrarHistorialFondo(event) {
  if (event.target === document.getElementById("modalHistorial")) {
    cerrarHistorial();
  }
}

// Escape cierra cualquier modal abierto.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    cerrarAyuda();
    cerrarHistorial();
  }
});

// ===== Historial =====

// Ultimas operaciones (maximo 5).
let historial = [];

// Sanitiza texto antes de mandarlo a innerHTML.
function escaparHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Mete la operacion mas nueva al inicio y recorta si pasa de 5.
function agregarAlHistorial(expresion, resultado) {
  historial.unshift({ expresion, resultado });
  if (historial.length > 5) historial.pop();
  renderizarHistorial();
}

// Renderiza el listado del modal historial.
function renderizarHistorial() {
  const lista = document.getElementById("historialLista");
  if (!lista) return;

  if (historial.length === 0) {
    lista.innerHTML = '<li class="historial-vacio">Sin operaciones aún</li>';
    return;
  }

  // Cada item trae onclick para reusar esa expresion.
  lista.innerHTML = historial
    .map((item, i) =>
      `<li class="historial-item" onclick="usarDelHistorial(${i})">
        <span class="historial-expr">${escaparHTML(item.expresion)}</span>
        <span class="historial-result">= ${escaparHTML(String(item.resultado))}</span>
      </li>`
    )
    .join("");
}

// Reusa una expresion del historial.
// Si ya hay algo escrito, la pega al final para seguir la cuenta.
function usarDelHistorial(index) {
  const expr = historial[index].expresion;
  expressionLine.innerText = "";
  mostrandoResultado = false;

  if (display.innerText === "0") {
    display.innerText = expr;
  } else {
    display.innerText += expr;
  }

  // Cerramos el modal para seguir operando directo.
  cerrarHistorial();
}

// ===== Tema =====

// Cambia entre tema oscuro y claro, y actualiza el icono del boton.
function toggleTema() {
  document.body.classList.toggle("light-theme");
  const btn = document.getElementById("btnTema");
  if (btn) {
    btn.textContent = document.body.classList.contains("light-theme") ? "☽" : "☀";
  }
}
