
import { useEffect, useState } from "react";
import Modal from "react-modal";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./App.css";

Modal.setAppElement("#root");

const COLORS = ["#a000ff", "#ff9300", "#f44336", "#00c49f", "#0088fe"];

function App() {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("balance");
    return saved !== null ? Number(saved) : 5000;
  });

  const [expenses, setExpenses] = useState(() => {
    return JSON.parse(localStorage.getItem("expenses") || "[]");
  });

  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [income, setIncome] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    localStorage.setItem("balance", balance);
  }, [balance]);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleIncome = (event) => {
    event.preventDefault();
    const amount = Number(income);

    if (!amount || amount <= 0) return;

    setBalance((previous) => previous + amount);
    setIncome("");
    setIncomeModal(false);
  };

  const openExpenseModal = (expense = null) => {
    if (expense) {
      setEditingId(expense.id);
      setForm({
        title: expense.title,
        price: String(expense.price),
        category: expense.category,
        date: expense.date,
      });
    } else {
      setEditingId(null);
      setForm({ title: "", price: "", category: "", date: "" });
    }
    setExpenseModal(true);
  };

  const handleExpense = (event) => {
    event.preventDefault();

    const price = Number(form.price);
    if (
      !form.title.trim() ||
      !form.category ||
      !form.date ||
      !form.price ||
      price <= 0
    ) {
      alert("Please fill all fields correctly.");
      return;
    }

    if (editingId !== null) {
      const oldExpense = expenses.find((item) => item.id === editingId);
      const availableBalance = balance + oldExpense.price;

      if (price > availableBalance) {
        alert("You cannot spend more than your wallet balance.");
        return;
      }

      setBalance(availableBalance - price);
      setExpenses((previous) =>
        previous.map((item) =>
          item.id === editingId ? { ...item, ...form, price } : item
        )
      );
    } else {
      if (price > balance) {
        alert("You cannot spend more than your wallet balance.");
        return;
      }

      const newExpense = {
        id: Date.now(),
        ...form,
        price,
      };

      setBalance((previous) => previous - price);
      setExpenses((previous) => [...previous, newExpense]);
    }

    setForm({ title: "", price: "", category: "", date: "" });
    setEditingId(null);
    setExpenseModal(false);
  };

  const deleteExpense = (id) => {
    const expense = expenses.find((item) => item.id === id);
    if (!expense) return;

    setBalance((previous) => previous + expense.price);
    setExpenses((previous) => previous.filter((item) => item.id !== id));
  };

  const categoryData = Object.values(
    expenses.reduce((result, expense) => {
      if (!result[expense.category]) {
        result[expense.category] = {
          name: expense.category,
          value: 0,
        };
      }
      result[expense.category].value += expense.price;
      return result;
    }, {})
  );

  const trendData = categoryData.map((item) => ({
    category: item.name,
    amount: item.value,
  }));

  return (
    <main className="app">
      <h1>Expense Tracker</h1>

      <section className="top-section">
        <div className="wallet-card">
          <h2>
            Wallet Balance: ${balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
          <button type="button" onClick={() => setIncomeModal(true)}>
            + Add Income
          </button>
        </div>

        <div className="expense-card">
          <h2>Expenses</h2>
          <button type="button" onClick={() => openExpenseModal()}>
            + Add Expense
          </button>
        </div>
      </section>

      <section className="charts-section">
        <div className="chart-card">
          <h2>Expense Summary</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">No expenses yet</p>
          )}
        </div>

        <div className="chart-card">
          <h2>Expense Trends</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#a000ff" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">No trends to display</p>
          )}
        </div>
      </section>

      <section className="history-section">
        <h2>Recent Transactions</h2>
        {expenses.length === 0 ? (
          <p className="empty-message">No expenses added yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.title}</td>
                    <td>${expense.price.toFixed(2)}</td>
                    <td>{expense.category}</td>
                    <td>{expense.date}</td>
                    <td className="actions">
                      <button
                        type="button"
                        aria-label="Edit expense"
                        onClick={() => openExpenseModal(expense)}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete expense"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        isOpen={incomeModal}
        onRequestClose={() => setIncomeModal(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Add Income</h2>
        <form onSubmit={handleIncome}>
          <input
            type="number"
            placeholder="Income Amount"
            value={income}
            min="0.01"
            step="0.01"
            onChange={(event) => setIncome(event.target.value)}
            required
          />
          <div className="modal-actions">
            <button type="submit">Add Balance</button>
            <button type="button" onClick={() => setIncomeModal(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={expenseModal}
        onRequestClose={() => setExpenseModal(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>{editingId !== null ? "Edit Expense" : "Add Expense"}</h2>
        <form onSubmit={handleExpense}>
          <input
            type="text"
            name="title"
            placeholder="Expense Title"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Expense Amount"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(event) =>
              setForm({ ...form, price: event.target.value })
            }
            required
          />
          <select
            name="category"
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            required
          >
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Others">Others</option>
          </select>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={(event) =>
              setForm({ ...form, date: event.target.value })
            }
            required
          />
          <div className="modal-actions">
            <button type="submit">
              {editingId !== null ? "Update Expense" : "Add Expense"}
            </button>
            <button type="button" onClick={() => setExpenseModal(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

export default App;
