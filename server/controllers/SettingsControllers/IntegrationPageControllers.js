
require("dotenv").config();

const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

const SUPPORTED_PLATFORMS = new Set(["github", "linkedin", "bitbucket"]);

const PLATFORM_CONFIG = {
	github: {
		clientIdEnv: "GITHUB_CLIENT_ID",
		clientSecretEnv: "GITHUB_CLIENT_SECRET",
		redirectUriEnv: "GITHUB_REDIRECT_URI",
		authorizationUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		profileUrl: "https://api.github.com/user",
		scope: "read:user repo",
	},
	linkedin: {
		clientIdEnv: "LINKEDIN_CLIENT_ID",
		clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
		redirectUriEnv: "LINKEDIN_REDIRECT_URI",
		authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
		tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
		profileUrl: "https://api.linkedin.com/v2/userinfo",
		scope: "openid profile email",
	},
	bitbucket: {
		clientIdEnv: "BITBUCKET_CLIENT_ID",
		clientSecretEnv: "BITBUCKET_CLIENT_SECRET",
		redirectUriEnv: "BITBUCKET_REDIRECT_URI",
		authorizationUrl: "https://bitbucket.org/site/oauth2/authorize",
		tokenUrl: "https://bitbucket.org/site/oauth2/access_token",
		profileUrl: "https://api.bitbucket.org/2.0/user",
		scope: "account repository",
	},
};

const getEncryptionKey = () => {
	const secret = process.env.JWT_SECRET_KEY;
	if (!secret) {
		throw new Error("JWT_SECRET_KEY is required for token encryption.");
	}
	return crypto.createHash("sha256").update(secret).digest();
};

const encryptOAuthToken = (value) => {
	if (!value) return "";

	const iv = crypto.randomBytes(12);
	const key = getEncryptionKey();
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

	const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

const isSupportedPlatform = (platform) => SUPPORTED_PLATFORMS.has(platform);

const getPlatformConfig = (platform) => PLATFORM_CONFIG[platform];

const getOAuthCredentials = (platform) => {
	const config = getPlatformConfig(platform);
	const clientId = process.env[config.clientIdEnv];
	const clientSecret = process.env[config.clientSecretEnv];
	const redirectUri = process.env[config.redirectUriEnv];

	if (!clientId || !clientSecret || !redirectUri) {
		throw new Error(`Missing OAuth env vars for ${platform}`);
	}

	return { clientId, clientSecret, redirectUri };
};

const createOAuthState = (userId, platform) => {
	return jwt.sign(
		{
			userId,
			platform,
			nonce: crypto.randomBytes(8).toString("hex"),
		},
		process.env.JWT_SECRET_KEY,
		{ expiresIn: "10m" }
	);
};

const buildAuthorizationUrl = (platform, userId) => {
	const config = getPlatformConfig(platform);
	const { clientId, redirectUri } = getOAuthCredentials(platform);
	const state = createOAuthState(userId, platform);

	const url = new URL(config.authorizationUrl);
	url.searchParams.set("client_id", clientId);
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("state", state);

	if (platform === "linkedin" || platform === "bitbucket") {
		url.searchParams.set("response_type", "code");
	}

	if (config.scope) {
		url.searchParams.set("scope", config.scope);
	}

	return url.toString();
};

const exchangeGithubCodeForToken = async (code) => {
	const config = getPlatformConfig("github");
	const { clientId, clientSecret, redirectUri } = getOAuthCredentials("github");

	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code,
		redirect_uri: redirectUri,
	});

	const tokenResponse = await axios.post(config.tokenUrl, body, {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		},
	});

	const accessToken = tokenResponse.data?.access_token;
	if (!accessToken) {
		throw new Error("GitHub access token missing");
	}

	const profileResponse = await axios.get(config.profileUrl, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github+json",
		},
	});

	return {
		accessToken,
		refreshToken: "",
		username: profileResponse.data?.login || "",
	};
};

const exchangeLinkedInCodeForToken = async (code) => {
	const config = getPlatformConfig("linkedin");
	const { clientId, clientSecret, redirectUri } = getOAuthCredentials("linkedin");

	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: redirectUri,
	});

	const tokenResponse = await axios.post(config.tokenUrl, body, {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});

	const accessToken = tokenResponse.data?.access_token;
	const refreshToken = tokenResponse.data?.refresh_token || "";

	if (!accessToken) {
		throw new Error("LinkedIn access token missing");
	}

	const profileResponse = await axios.get(config.profileUrl, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const username =
		profileResponse.data?.preferred_username ||
		profileResponse.data?.name ||
		profileResponse.data?.sub ||
		"";

	return {
		accessToken,
		refreshToken,
		username,
	};
};

const exchangeBitbucketCodeForToken = async (code) => {
	const config = getPlatformConfig("bitbucket");
	const { clientId, clientSecret, redirectUri } = getOAuthCredentials("bitbucket");

	const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
	});

	const tokenResponse = await axios.post(config.tokenUrl, body, {
		headers: {
			Authorization: `Basic ${basicAuth}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});

	const accessToken = tokenResponse.data?.access_token;
	const refreshToken = tokenResponse.data?.refresh_token || "";

	if (!accessToken) {
		throw new Error("Bitbucket access token missing");
	}

	const profileResponse = await axios.get(config.profileUrl, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const username =
		profileResponse.data?.username ||
		profileResponse.data?.nickname ||
		profileResponse.data?.display_name ||
		profileResponse.data?.account_id ||
		"";

	return {
		accessToken,
		refreshToken,
		username,
	};
};

const exchangeCodeForToken = async (platform, code) => {
	if (platform === "github") return exchangeGithubCodeForToken(code);
	if (platform === "linkedin") return exchangeLinkedInCodeForToken(code);
	if (platform === "bitbucket") return exchangeBitbucketCodeForToken(code);
	throw new Error("Unsupported platform");
};

const getFrontendIntegrationRedirectUrl = (platform, status, errorMessage = "") => {
	const frontendBase = process.env.CLIENT_URL || "http://localhost:5173";
	const redirectUrl = new URL(`${frontendBase}/settings/integration`);
	redirectUrl.searchParams.set("platform", platform);
	redirectUrl.searchParams.set("status", status);
	if (errorMessage) {
		redirectUrl.searchParams.set("error", errorMessage);
	}
	return redirectUrl.toString();
};

const getIntegrationStatus = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("integrations");

		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		const integrations = user.integrations || {};

		const payload = {
			github: {
				connected: integrations.github?.connected || false,
				username: integrations.github?.username || "",
				lastSynced: integrations.github?.lastSynced || null,
				autoSync: integrations.github?.autoSync || false,
			},
			linkedin: {
				connected: integrations.linkedin?.connected || false,
				username: integrations.linkedin?.username || "",
				lastSynced: integrations.linkedin?.lastSynced || null,
				autoSync: integrations.linkedin?.autoSync || false,
			},
			bitbucket: {
				connected: integrations.bitbucket?.connected || false,
				username: integrations.bitbucket?.username || "",
				lastSynced: integrations.bitbucket?.lastSynced || null,
				autoSync: integrations.bitbucket?.autoSync || false,
			},
		};

		return res.status(200).json({ success: true, integrations: payload });
	} catch (error) {
		return res.status(500).json({ success: false, message: "Error while fetching integration status" });
	}
};

const initiateIntegrationConnection = async (req, res) => {
	try {
		const platform = String(req.params.platform || "").toLowerCase();
		if (!isSupportedPlatform(platform)) {
			return res.status(400).json({ success: false, message: "Unsupported platform" });
		}

		const authUrl = buildAuthorizationUrl(platform, req.userId);
		return res.status(200).json({ success: true, authUrl });
	} catch (error) {
		return res.status(500).json({ success: false, message: "Error while initiating OAuth connection" });
	}
};

const handleIntegrationCallback = async (req, res) => {
	try {
		const platform = String(req.params.platform || "").toLowerCase();
		const code = req.query.code;
		const state = req.query.state;

		if (!isSupportedPlatform(platform)) {
			return res.redirect(getFrontendIntegrationRedirectUrl(platform, "error", "Unsupported platform"));
		}

		if (!code || !state) {
			return res.redirect(getFrontendIntegrationRedirectUrl(platform, "error", "Missing code or state"));
		}

		const decodedState = jwt.verify(state, process.env.JWT_SECRET_KEY);
		if (decodedState.platform !== platform || !decodedState.userId) {
			return res.redirect(getFrontendIntegrationRedirectUrl(platform, "error", "Invalid state payload"));
		}

		const user = await User.findById(decodedState.userId);
		if (!user) {
			return res.redirect(getFrontendIntegrationRedirectUrl(platform, "error", "User not found"));
		}

		const tokenData = await exchangeCodeForToken(platform, code);

		user.set(`integrations.${platform}.connected`, true);
		user.set(`integrations.${platform}.username`, tokenData.username || "");
		user.set(`integrations.${platform}.accessToken`, encryptOAuthToken(tokenData.accessToken));
		user.set(`integrations.${platform}.refreshToken`, encryptOAuthToken(tokenData.refreshToken));
		user.set(`integrations.${platform}.lastSynced`, new Date());

		if (typeof user.integrations?.[platform]?.autoSync !== "boolean") {
			user.set(`integrations.${platform}.autoSync`, false);
		}

		await user.save();

		return res.redirect(getFrontendIntegrationRedirectUrl(platform, "success"));
	} catch (error) {
		const platform = String(req.params.platform || "").toLowerCase();
		return res.redirect(getFrontendIntegrationRedirectUrl(platform, "error", "OAuth callback failed"));
	}
};

const disconnectIntegration = async (req, res) => {
	try {
		const platform = String(req.params.platform || "").toLowerCase();
		if (!isSupportedPlatform(platform)) {
			return res.status(400).json({ success: false, message: "Unsupported platform" });
		}

		const user = await User.findById(req.userId);
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		user.set(`integrations.${platform}.connected`, false);
		user.set(`integrations.${platform}.username`, "");
		user.set(`integrations.${platform}.accessToken`, "");
		user.set(`integrations.${platform}.refreshToken`, "");
		user.set(`integrations.${platform}.lastSynced`, null);
		user.set(`integrations.${platform}.autoSync`, false);

		await user.save();

		return res.status(200).json({
			success: true,
			message: `${platform} disconnected successfully`,
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: "Error while disconnecting integration" });
	}
};

const toggleIntegrationAutoSync = async (req, res) => {
	try {
		const platform = String(req.params.platform || "").toLowerCase();
		const { autoSync } = req.body;

		if (!isSupportedPlatform(platform)) {
			return res.status(400).json({ success: false, message: "Unsupported platform" });
		}

		const user = await User.findById(req.userId);
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		const current = Boolean(user.integrations?.[platform]?.autoSync);
		const nextValue = typeof autoSync === "boolean" ? autoSync : !current;

		user.set(`integrations.${platform}.autoSync`, nextValue);
		await user.save();

		return res.status(200).json({
			success: true,
			platform,
			autoSync: nextValue,
			message: `Auto sync ${nextValue ? "enabled" : "disabled"} for ${platform}`,
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: "Error while toggling auto sync" });
	}
};

module.exports = {
	getIntegrationStatus,
	initiateIntegrationConnection,
	handleIntegrationCallback,
	disconnectIntegration,
	toggleIntegrationAutoSync,
};
