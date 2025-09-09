const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");

// ====================== CONFIG ======================
const accounts = [
	{ name: "John Varghese", email: "john@mxrn.lol" },
	{ name: "Kandathil Group", email: "kandathil@mxrn.lol" },
	{ name: "Yohannan Varghese", email: "yohannan@mxrn.lol" },
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

// ====================== HELPERS ======================
function buildSignature(sender) {
	// if the sender is "Kandathil Group", don’t add the extra line
	if (sender.name.toLowerCase() === "kandathil group") {
		return `${sender.name}\n+91 86062 80201`;
	} else {
		return `${sender.name}\nKandathil Group\n+91 86062 80201`;
	}
}

function buildSignatureHtml(sender) {
	if (sender.name.toLowerCase() === "kandathil group") {
		return `${sender.name}<br/>+91 86062 80201`;
	} else {
		return `${sender.name}<br/><em>Kandathil Group</em><br/>+91 86062 80201`;
	}
}

// ====================== EMAIL MODELS ======================
const emailModels = [
	{
		subject: (company) =>
			`Invitation to Lease at Kandathil Group Mall – ${company}`,
		text: (company, sender) => `Dear Sir/Madam,

In the heart of Ponkunnam Market – often called the Venice of the East – Kandathil Group of Companies has developed a landmark shopping mall spread across three floors and covering 70,000 sq. ft. This new complex, located just 32 km east of Kottayam city and directly facing NH 183, provides a golden opportunity for forward-looking businesses.

The mall is designed to serve lakhs of consumers across Kumily, Peerumedu, Kuttikkanam, Peruvanthanam, Mundakkayam, Elappara, Vagamon, Kanjirappally, Erumeli, Ranni, Manimala, Pala, Erattupetta, Pampady, Manarkadu, Vazhoor, Pallikkothode, and many more. Historically, these communities have relied heavily on the Ponkunnam market, and today we are reviving and expanding this legacy into a modern commercial hub.

We warmly invite ${company} to consider establishing your presence in this premium complex and becoming a key part of its growth story.

Best regards,
${buildSignature(sender)}`,
		html: (company, sender) => `
      <p>Dear Sir/Madam,</p>
      <p>In the heart of <strong>Ponkunnam Market</strong> – often called the <em>Venice of the East</em> – Kandathil Group of Companies has developed a landmark shopping mall spread across three floors and covering <strong>70,000 sq. ft.</strong> This new complex, located just 32 km east of Kottayam city and directly facing NH 183, provides a golden opportunity for forward-looking businesses.</p>
      <p>The mall is designed to serve lakhs of consumers across Kumily, Peerumedu, Kuttikkanam, Peruvanthanam, Mundakkayam, Elappara, Vagamon, Kanjirappally, Erumeli, Ranni, Manimala, Pala, Erattupetta, Pampady, Manarkadu, Vazhoor, Pallikkothode, and many more. Historically, these communities have relied heavily on the Ponkunnam market, and today we are reviving and expanding this legacy into a modern commercial hub.</p>
      <p>We warmly invite <strong>${company}</strong> to consider establishing your presence in this premium complex and becoming a key part of its growth story.</p>
      <p>Best regards,<br/>${buildSignatureHtml(sender)}</p>
    `,
	},
	{
		subject: () => `Premium Retail Space Opportunity in Ponkunnam`,
		text: (company, sender) => `Dear Sir/Madam,

Kandathil Group proudly introduces a state-of-the-art shopping complex in Ponkunnam Town, a region celebrated for its historic trade significance. Spanning 70,000 sq. ft. over three levels and strategically located facing NH 183, the mall is just 32 km from Kottayam and is positioned as a premier commercial destination.

The project is set to attract vast consumer traffic from surrounding areas including Kumily, Peerumedu, Kuttikkanam, Peruvanthanam, Mundakkayam, Elappara, Vagamon, Kanjirappally, Erumeli, Ranni, Manimala, Pala, Erattupetta, Pampady, Manarkadu, Vazhoor, and Pallikkothode. These regions have long relied on Ponkunnam Market, and this modern development continues that tradition on a much larger scale.

We believe ${company} would be an excellent fit for this new commercial hub. We would be delighted to provide further details and explore how this opportunity could serve your expansion plans.

Sincerely,
${buildSignature(sender)}`,
		html: (company, sender) => `
      <p>Dear Sir/Madam,</p>
      <p>Kandathil Group proudly introduces a <strong>state-of-the-art shopping complex</strong> in <strong>Ponkunnam Town</strong>, a region celebrated for its historic trade significance. Spanning <strong>70,000 sq. ft.</strong> over three levels and strategically located facing NH 183, the mall is just 32 km from Kottayam and is positioned as a premier commercial destination.</p>
      <p>The project is set to attract vast consumer traffic from surrounding areas including Kumily, Peerumedu, Kuttikkanam, Peruvanthanam, Mundakkayam, Elappara, Vagamon, Kanjirappally, Erumeli, Ranni, Manimala, Pala, Erattupetta, Pampady, Manarkadu, Vazhoor, and Pallikkothode. These regions have long relied on Ponkunnam Market, and this modern development continues that tradition on a much larger scale.</p>
      <p>We believe <strong>${company}</strong> would be an excellent fit for this new commercial hub. We would be delighted to provide further details and explore how this opportunity could serve your expansion plans.</p>
      <p>Sincerely,<br/>${buildSignatureHtml(sender)}</p>
    `,
	},
];

// ====================== UTILITY ======================
let counter = 0;
function getSender() {
	const sender = accounts[counter % accounts.length];
	counter++;
	return sender;
}

function pickEmailModel() {
	return emailModels[Math.floor(Math.random() * emailModels.length)];
}

function log(message) {
	console.log(message);
	fs.appendFileSync(logFile, message + "\n");
}

// ====================== SEND FUNCTION ======================
async function sendMail(to, company, extraAttachments = []) {
	const sender = getSender();
	const from = `"${sender.name}" <${sender.email}>`;
	const model = pickEmailModel();

	const attachments = extraAttachments.map((file) => ({
		filename: path.basename(file),
		path: file,
	}));

	try {
		await transporter.sendMail({
			from,
			to,
			subject: model.subject(company),
			text: model.text(company, sender),
			html: model.html(company, sender),
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

		const files = fs.existsSync(attachmentsFolder)
			? fs
					.readdirSync(attachmentsFolder)
					.map((f) => path.join(attachmentsFolder, f))
			: [];

		setTimeout(() => sendMail(email, company, files), counter * 1000);
		counter++;
	})
	.on("end", () => {
		log("[INFO] All emails queued for sending");
	});
