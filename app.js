function getActiveProducts() {
  const saved = localStorage.getItem("alfaki_products");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (_) {
      // تجاهل البيانات التالفة والرجوع للمصفوفة الافتراضية
    }
  }
  return typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
}

const WHATSAPP_NUMBER = "249900797477"; // ضع رقم واتساب المتجر بالصيغة الدولية

const DELIVERY_RATES = {
  "أم درمان": 5000,
  "الخرطوم": 10000,
  "بحري": 10000,
  "بورتسودان": 30000,
  "مدني": 20000,
  "عطبرة": 20000,
  "أخرى": 25000
};

let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("alfaki_cart") || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch (_) {
  cart = [];
}

let activeFabric = "all";

const productsGrid = document.getElementById("productsGrid");
const cartCount = document.getElementById("cartCount");
const cartItemsContainer = document.getElementById("cartItems");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const cartTotalEl = document.getElementById("cartTotal");
const citySelect = document.getElementById("customerCity");
const cartModal = document.getElementById("cartModal");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const orderForm = document.getElementById("orderForm");
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

function saveCart() {
  localStorage.setItem("alfaki_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  if (!cartCount) return;
  const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  cartCount.textContent = String(totalQty);
}

function renderProducts() {
  if (!productsGrid) return;
  const allProducts = getActiveProducts();
  const filtered =
    activeFabric === "all"
      ? allProducts
      : allProducts.filter((p) => String(p.fabric || "").includes(activeFabric));

  if (filtered.length === 0) {
    productsGrid.innerHTML =
      '<p style="text-align:center;color:#52525b;grid-column:1/-1;">لا توجد جلاليب مطابقة لهذا القماش حالياً.</p>';
    return;
  }

  productsGrid.innerHTML = filtered
    .map((p) => {
      const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["قياسي"];
      const colors = Array.isArray(p.colors) && p.colors.length ? p.colors : ["أبيض"];
      const sizeOptions = sizes.map((s) => `<option value="${s}">مقاس ${s}</option>`).join("");
      const colorOptions = colors.map((c) => `<option value="${c}">${c}</option>`).join("");

      const imgHtml = p.image
        ? `<img src="${p.image}" alt="${p.name}" class="product-img" onerror="this.outerHTML='<div class=\\'product-img-placeholder\\'>جلابية الفكي سليم</div>';" />`
        : `<div class="product-img-placeholder">جلابية الفكي سليم</div>`;

      return `
        <article class="product-card">
          ${imgHtml}
          <div class="product-body">
            <h3 class="product-title">${p.name}</h3>
            <div class="product-meta">${p.fabric || ""} • ${p.embroidery || ""}</div>
            <p class="product-desc">${p.description || ""}</p>
            <div class="product-price">${Number(p.price || 0).toLocaleString()} ${p.currency || "ج.س"}</div>
            <div class="selectors">
              <select id="size-${p.id}" aria-label="اختر المقاس">${sizeOptions}</select>
              <select id="color-${p.id}" aria-label="اختر اللون">${colorOptions}</select>
            </div>
            <button type="button" class="add-btn" onclick="addToCart(${p.id})">أضف إلى السلة</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function addToCart(productId) {
  const allProducts = getActiveProducts();
  const product = allProducts.find((p) => String(p.id) === String(productId));
  if (!product) return;

  const sizeEl = document.getElementById(`size-${product.id}`);
  const colorEl = document.getElementById(`color-${product.id}`);
  const selectedSize = sizeEl ? sizeEl.value : (product.sizes && product.sizes[0]) || "قياسي";
  const selectedColor = colorEl ? colorEl.value : (product.colors && product.colors[0]) || "أبيض";

  const existing = cart.find(
    (item) =>
      String(item.id) === String(product.id) &&
      item.size === selectedSize &&
      item.color === selectedColor
  );

  if (existing) {
    existing.qty = (Number(existing.qty) || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      currency: product.currency || "ج.س",
      size: selectedSize,
      color: selectedColor,
      qty: 1
    });
  }

  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function getDeliveryFee() {
  if (!citySelect) return 0;
  const city = citySelect.value;
  return DELIVERY_RATES[city] || 0;
}

function renderCart() {
  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML =
      '<p style="text-align:center;color:#52525b;padding:12px 0;">السلة فارغة حالياً.</p>';
  } else {
    cartItemsContainer.innerHTML = cart
      .map(
        (item, idx) => `
        <div class="cart-item">
          <div>
            <strong>${item.name}</strong>
            <div style="font-size:0.85rem;color:#52525b;">
              ${item.size} • ${item.color} • الكمية: ${item.qty}
            </div>
            <div style="font-size:0.9rem;font-weight:700;">
              ${(Number(item.price) * Number(item.qty)).toLocaleString()} ${item.currency || "ج.س"}
            </div>
          </div>
          <button type="button" class="remove-item-btn" onclick="removeFromCart(${idx})">حذف</button>
        </div>
      `
      )
      .join("");
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
    0
  );
  const fee = cart.length > 0 ? getDeliveryFee() : 0;
  const total = subtotal + fee;

  if (cartSubtotalEl) cartSubtotalEl.textContent = subtotal.toLocaleString();
  if (deliveryFeeEl) deliveryFeeEl.textContent = fee.toLocaleString();
  if (cartTotalEl) cartTotalEl.textContent = total.toLocaleString();
}

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFabric = btn.getAttribute("data-fabric") || "all";
    renderProducts();
  });
});

if (openCartBtn && cartModal) {
  openCartBtn.addEventListener("click", () => {
    renderCart();
    cartModal.classList.remove("hidden");
  });
}

if (closeCartBtn && cartModal) {
  closeCartBtn.addEventListener("click", () => {
    cartModal.classList.add("hidden");
  });
}

if (citySelect) {
  citySelect.addEventListener("change", renderCart);
}

if (orderForm) {
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("أضف جلابية واحدة على الأقل إلى السلة قبل إرسال الطلب.");
      return;
    }

    const name = (document.getElementById("customerName")?.value || "").trim();
    const phone = (document.getElementById("customerPhone")?.value || "").trim();
    const city = (document.getElementById("customerCity")?.value || "").trim();
    const address = (document.getElementById("customerAddress")?.value || "").trim();
    const lengthVal = (document.getElementById("measureLength")?.value || "").trim();
    const chestVal = (document.getElementById("measureChest")?.value || "").trim();
    const sleeveVal = (document.getElementById("measureSleeve")?.value || "").trim();
    const notes = (document.getElementById("customerNotes")?.value || "").trim();

    const subtotal = cart.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
      0
    );
    const fee = getDeliveryFee();
    const total = subtotal + fee;

    const itemsText = cart
      .map(
        (item, i) =>
          `${i + 1}. ${item.name} (${item.size} - ${item.color}) × ${item.qty} = ${(
            Number(item.price) * Number(item.qty)
          ).toLocaleString()} ${item.currency || "ج.س"}`
      )
      .join("\n");

    const measurementsLines = [];
    if (lengthVal) measurementsLines.push(`• الطول: ${lengthVal}`);
    if (chestVal) measurementsLines.push(`• الصدر/العرض: ${chestVal}`);
    if (sleeveVal) measurementsLines.push(`• طول الكم/الكتف: ${sleeveVal}`);

    const lines = [
      "مرحباً متجر الفكي سليم للجلابيب، طلب جديد:",
      "",
      "المنتجات:",
      itemsText,
      "",
      `قيمة الجلاليب: ${subtotal.toLocaleString()} ج.س`,
      `رسوم التوصيل (${city}): ${fee.toLocaleString()} ج.س`,
      `الإجمالي النهائي: ${total.toLocaleString()} ج.س`,
      "",
      "بيانات العميل:",
      `• الاسم: ${name}`,
      `• الهاتف: ${phone}`,
      `• المدينة: ${city}`,
      `• العنوان: ${address}`
    ];

    if (measurementsLines.length > 0) {
      lines.push("", "القياسات:", ...measurementsLines);
    }

    if (notes) {
      lines.push("", `ملاحظات: ${notes}`);
    }

    const message = encodeURIComponent(lines.join("\n"));
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(waUrl, "_blank");
  });
}

updateCartBadge();
renderProducts();
renderCart();