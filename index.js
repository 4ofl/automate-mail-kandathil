const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");

// ====================== CONFIG ======================
const accounts = [
	{ name: "Kandathil, John", email: "john@mxrn.lol" },
	{ name: "Kandathil Group", email: "kandathil@mxrn.lol" },
	{ name: "Kandathil, Yohannan", email: "yohannan@mxrn.lol" },
];

const smtpConfig = {
	host: "smtp.sendgrid.net",
	port: 465,
	secure: true,
	auth: {
		user: "apikey",
		pass: "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",
	},
};

const contactsFile = "contacts.csv";
const logFile = "email_log.txt";
const attachmentsFolder = "attachments"; // put files here

// ====================== TRANSPORTER ======================
const transporter = nodemailer.createTransport(smtpConfig);

// ====================== EMAIL CONTENT ======================
const emailTemplate = {
	subject: (company) => `Exploring Leasing Opportunities for ${company}`,
	text: (company) => `Hello ${company},

I’m reaching out from Kandathil Group. We currently have a premium retail space available that could be a great fit for your brand.

Would you be open to a quick chat or receiving more details?

Best regards,
John Kandathil
Kandathil Group
+91 XXXXX XXXXX`,
	html: (company) => `
    <p>Hello ${company},</p>
    <p>I’m reaching out from <strong>Kandathil Group</strong>. We currently have a premium retail space available that could be a great fit for your brand.</p>
    <p>Would you be open to a quick chat or receiving more details?</p>
    <p>Best regards,<br/>
    John Kandathil<br/>
    <em>Kandathil Group</em><br/>
    +91 XXXXX XXXXX </p>
  `,
};

// ====================== UTILITY ======================
let counter = 0;
function getSender() {
	const sender = accounts[counter % accounts.length];
	counter++;
	return `"${sender.name}" <${sender.email}>`;
}

// simple logging
function log(message) {
	console.log(message);
	fs.appendFileSync(logFile, message + "\n");
}

// ====================== SEND FUNCTION ======================
async function sendMail(to, company, extraAttachments = []) {
	const from = getSender();

	// collect attachments
	const attachments = extraAttachments.map((file) => ({
		filename: path.basename(file),
		path: file,
	}));

	try {
		await transporter.sendMail({
			from,
			to,
			subject: emailTemplate.subject(company),
			text: emailTemplate.text(company),
			html: emailTemplate.html(company),
			attachments,
		});
		log(`[SUCCESS] Sent from ${from} to ${to}`);
	} catch (err) {
		log(`[FAIL] Error sending from ${from} to ${to}: ${err.message}`);
	}
}

// ====================== PROCESS CSV ======================
fs.createReadStream(contactsFile)
	.pipe(csv())
	.on("data", async (row) => {
		const company = row.name;
		const email = row.email;

		// optionally attach all files in attachments folder
		const files = fs.existsSync(attachmentsFolder)
			? fs
					.readdirSync(attachmentsFolder)
					.map((f) => path.join(attachmentsFolder, f))
			: [];

		// simple rate limit: 1 email per 10 second
		setTimeout(() => sendMail(email, company, files), counter * 10000);
		counter++;
	})
	.on("end", () => {
		log("[INFO] All emails queued for sending");
	});
