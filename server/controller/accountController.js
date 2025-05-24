import Account from "../model/Account.js";

// Helper to generate unique accountId
const generateAccountId = async () => {
  while (true) {
    const randomId = `ACC-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await Account.findOne({ accountId: randomId });
    if (!existing) return randomId;
  }
};

export const createAccount = async (req, res) => {
  try {
    const {
      accountType,
      accountName,
      phoneNumber,
      whatsappNumber,
      creditLimit,
      address
    } = req.body;

    // Validate all fields (assuming validation done by express-validator in route)
    
    const accountId = await generateAccountId();

    const account = new Account({
      accountId,
      accountType,
      accountName,
      phoneNumber,
      whatsappNumber,
      creditLimit,
      address
    });

    await account.save();

    return res.status(201).json({ message: "Account created", account });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    return res.json(accounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    return res.json(account);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      accountType,
      accountName,
      phoneNumber,
      whatsappNumber,
      creditLimit,
      address
    } = req.body;

    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    account.accountType = accountType;
    account.accountName = accountName;
    account.phoneNumber = phoneNumber;
    account.whatsappNumber = whatsappNumber;
    account.creditLimit = creditLimit;
    account.address = address;

    await account.save();

    return res.json({ message: "Account updated", account });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findByIdAndDelete(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    return res.json({ message: "Account deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
