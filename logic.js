import { firebaseConfig } from "./firebase-config.js";
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const koleksiNilai = collection(db, "nilai");

// Deteksi halaman yang sedang dibuka
const isInputPage = document.getElementById("formNilai") !== null;
const isDaftarPage = document.getElementById("tabelNilai") !== null;

/* =============== HALAMAN INPUT =============== */
if (isInputPage) {
  const formNilai = document.getElementById("formNilai");
  const btnSimpan = document.getElementById("btnSimpan");
  const btnBatal = document.getElementById("btnBatal");
  const inputDocId = document.getElementById("docId");
  const inputNim = document.getElementById("nim");
  const inputNama = document.getElementById("nama");
  const inputMatkul = document.getElementById("matkul");
  const inputNilai = document.getElementById("nilai");

  function validasi() {
    return (
      inputNim.value &&
      inputNama.value &&
      inputMatkul.value &&
      inputNilai.value !== "" &&
      Number(inputNilai.value) >= 0 &&
      Number(inputNilai.value) <= 100
    );
  }

  btnSimpan.addEventListener("click", async () => {
    if (!validasi()) {
      alert("Pastikan semua input benar (Nilai 0–100).");
      return;
    }

    const data = {
      nim: inputNim.value.trim(),
      nama: inputNama.value.trim(),
      matkul: inputMatkul.value.trim(),
      nilai: Number(inputNilai.value),
      createdAt: Timestamp.fromDate(new Date())
    };

    try {
      if (inputDocId.value) {
        await updateDoc(doc(db, "nilai", inputDocId.value), data);
        alert("Data berhasil diubah!");
        inputDocId.value = "";
        btnBatal.classList.add("d-none");
      } else {
        await addDoc(koleksiNilai, data);
        alert("Data berhasil disimpan!");
      }
      formNilai.reset();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data.");
    }
  });

  btnBatal.addEventListener("click", () => {
    inputDocId.value = "";
    formNilai.reset();
    btnBatal.classList.add("d-none");
  });
}

/* =============== HALAMAN DAFTAR =============== */
if (isDaftarPage) {
  const tbodyNilai = document.getElementById("tbodyNilai");

  async function loadData() {
    tbodyNilai.innerHTML = "<tr><td colspan='7'>Memuat data...</td></tr>";
    try {
      const q = query(koleksiNilai, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        tbodyNilai.innerHTML = "<tr><td colspan='7'>Belum ada data.</td></tr>";
        return;
      }

      let rows = "";
      let no = 1;
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const tanggal = d.createdAt ? d.createdAt.toDate().toLocaleString() : "-";
        rows += `
          <tr>
            <td>${no++}</td>
            <td>${d.nim}</td>
            <td>${d.nama}</td>
            <td>${d.matkul}</td>
            <td>${d.nilai}</td>
            <td>${tanggal}</td>
            <td>
              <button class="btn btn-sm btn-warning me-1" onclick="editData('${docSnap.id}','${d.nim}','${d.nama}','${d.matkul}','${d.nilai}')">Ubah</button>
              <button class="btn btn-sm btn-danger" onclick="hapusData('${docSnap.id}')">Hapus</button>
            </td>
          </tr>`;
      });
      tbodyNilai.innerHTML = rows;
    } catch (err) {
      console.error(err);
      tbodyNilai.innerHTML = "<tr><td colspan='7'>Gagal memuat data.</td></tr>";
    }
  }

  window.editData = (id, nim, nama, matkul, nilai) => {
    // Simpan data ke localStorage agar bisa dikirim ke input.html
    localStorage.setItem("editDoc", JSON.stringify({ id, nim, nama, matkul, nilai }));
    window.location.href = "index.html";
  };

  window.hapusData = async (id) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteDoc(doc(db, "nilai", id));
      alert("Data berhasil dihapus.");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data.");
    }
  };

  loadData();
}

// Saat halaman input dibuka setelah klik “Ubah”
if (isInputPage && localStorage.getItem("editDoc")) {
  const data = JSON.parse(localStorage.getItem("editDoc"));
  document.getElementById("docId").value = data.id;
  document.getElementById("nim").value = data.nim;
  document.getElementById("nama").value = data.nama;
  document.getElementById("matkul").value = data.matkul;
  document.getElementById("nilai").value = data.nilai;
  document.getElementById("btnBatal").classList.remove("d-none");
  localStorage.removeItem("editDoc");
}
