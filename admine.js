const ADMIN_PASSWORD = "1#+;";

const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");
const adminProductsList = document.getElementById("adminProductsList");
const adminCount = document.getElementById("adminCount");
const passInput = document.getElementById("adminPassInput");
const loginBtn = document.getElementById("loginBtn");

function getStoredProducts() {
  const saved = localStorage.getItem("alfaki_products");
  if (saved) {
    return JSON.parse(saved);
  }
  return typeof PRODUCTS !== "undefined" ? [...PRODUCTS] : [];
}

function saveProducts(list) {
  localStorage.setItem("alfaki_products", JSON.stringify(list));
  renderAdminProducts();
}

function handleLogin() {
  const entered = (passInput.value || "").trim();
  if (entered === ADMIN_PASSWORD) {
    sessionStorage.setItem("alfaki_admin_logged", "1");
    showPanel();
  } else {
    alert("كلمة المرور غير صحيحة! اكتب: 1234");
    passInput.value = "";
    passInput.focus();
  }
}

loginBtn.addEventListener("click", handleLogin);

passInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleLogin();
  }
});

function showPanel() {
  loginSection.style.display = "none";
  adminPanel.style.display = "block";
  renderAdminProducts();
}

if (sessionStorage.getItem("alfaki_admin_logged") === "1") {
  showPanel();
}

function renderAdminProducts() {
  const list = getStoredProducts();
  adminCount.textContent = list.length;

  if (list.length === 0) {
    adminProductsList.innerHTML = '<p style="color:#6b7280;text-align:center;">لا توجد منتجات حالياً.</p>';
    return;
  }

  adminProductsList.innerHTML = list
    .map(
      (p, index) => `
      <div class="admin-item">
        <div>
          <strong>${p.name}</strong>
          <div style="font-size:0.85rem;color:#6b7280;">
            ${p.fabric} • ${Number(p.price).toLocaleString()} ${p.currency || "ج.س"}
          </div>
          <div style="font-size:0.8rem;color:#9ca3af;">
            المقاسات: ${(p.sizes || []).join(" - ")}
          </div>
        </div>
        <button type="button" class="remove-item-btn" onclick="deleteProduct(${index})">حذف</button>
      </div>
    `
    )
    .join("");
}

function deleteProduct(index) {
  const list = getStoredProducts();
  const item = list[index];
  if (confirm('هل أنت متأكد من حذف "' + item.name + '"؟')) {
    list.splice(index, 1);
    saveProducts(list);
  }
}

function readImageAsCompressedDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById("addProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("pName").value.trim();
  const fabric = document.getElementById("pFabric").value.trim();
  const embroidery = document.getElementById("pEmbroidery").value.trim();
  const price = Number(document.getElementById("pPrice").value);
  const sizes = document
    .getElementById("pSizes")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const colors = document
    .getElementById("pColors")
    .value.split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const desc = document.getElementById("pDesc").value.trim();
  const pathInput = document.getElementById("pImagePath").value.trim();
  const fileInput = document.getElementById("pImageFile").files[0];

  let finalImage = pathInput;
  if (fileInput) {
    finalImage = await readImageAsCompressedDataURL(fileInput);
  }

  const list = getStoredProducts();
  const newProduct = {
    id: Date.now(),
    name,
    fabric,
    embroidery,
    price,
    currency: "ج.س",
    sizes,
    colors,
    image: finalImage,
    description: desc
  };

  list.unshift(newProduct);
  saveProducts(list);

  e.target.reset();
  document.getElementById("pSizes").value = "52, 54, 56, 58, 60";
  document.getElementById("pColors").value = "أبيض ناصع, سكري, بيج";
  alert("تمت إضافة الجلابية بنجاح!");
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const list = getStoredProducts();
  const code = "const PRODUCTS = " + JSON.stringify(list, null, 2) + ";\n";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        alert("تم نسخ كود products.js المحدّث! افتح ملف products.js في Acode والصقه بدلاً من القديم.");
      })
      .catch(() => {
        prompt("انسخ الكود التالي وضعه في ملف products.js:", code);
      });
  } else {
    prompt("انسخ الكود التالي وضعه في ملف products.js:", code);
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("هل تريد حذف التعديلات المؤقتة والعودة لملف products.js الأصلي؟")) {
    localStorage.removeItem("alfaki_products");
    renderAdminProducts();
  }
});