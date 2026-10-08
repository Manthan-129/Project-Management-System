const DEFAULT_SMTP_HOST = "smtp-relay.brevo.com";
const DEFAULT_SMTP_PORT = 587;

class EmailConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = "EmailConfigError";
        this.code = "EMAIL_CONFIG_MISSING";
    }
}

const toBoolean = (value, fallback) => {
    if (value === undefined) return fallback;
    if (typeof value === "boolean") return value;
    return String(value).trim().toLowerCase() === "true";
};

const toPort = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveSenderEmail = () => {
    const explicitSender = process.env.SENDER_EMAIL?.trim();
    if (explicitSender) {
        return explicitSender;
    }

    const smtpUser = process.env.SMTP_USER?.trim();
    if (smtpUser && smtpUser.includes("@") && !smtpUser.endsWith("@smtp-brevo.com")) {
        return smtpUser;
    }

    return "";
};

const getEmailConfig = () => {
    const smtpHost = process.env.SMTP_HOST?.trim() || DEFAULT_SMTP_HOST;
    const smtpPort = toPort(process.env.SMTP_PORT, DEFAULT_SMTP_PORT);
    const smtpSecure = toBoolean(process.env.SMTP_SECURE, smtpPort === 465);
    const smtpUser = process.env.SMTP_USER?.trim() || "";
    const smtpPass = process.env.SMTP_PASS?.trim() || "";
    const senderEmail = resolveSenderEmail();

    return {
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        senderEmail,
    };
};

const assertEmailConfig = () => {
    const config = getEmailConfig();
    const missing = [];

    if (!config.smtpUser) missing.push("SMTP_USER");
    if (!config.smtpPass) missing.push("SMTP_PASS");
    if (!config.senderEmail) missing.push("SENDER_EMAIL");

    if (missing.length > 0) {
        throw new EmailConfigError(`Email service is not configured. Missing: ${missing.join(", ")}`);
    }

    return config;
};

module.exports = {
    EmailConfigError,
    getEmailConfig,
    assertEmailConfig,
};
