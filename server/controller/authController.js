
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/user.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    {/*if (!user.warehouse) {
      return res.status(403).json({ message: "Warehouse not assigned. Contact admin." });
    }*/}

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user._id, role: user.role }, "yourSecretKey", { expiresIn: "9d" });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
