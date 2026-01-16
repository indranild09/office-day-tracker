import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(
      doc(db, "users", res.user.uid),
      {
        firstName,
        lastName,
        email,
        createdAt: new Date()
      },
      { merge: true } // ✅ CRITICAL
    );
  };

  return (
    <form onSubmit={handleRegister}>
      <input placeholder="First Name" onChange={e => setFirstName(e.target.value)} />
      <input placeholder="Last Name" onChange={e => setLastName(e.target.value)} />
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button>Register</button>
    </form>
  );
}
