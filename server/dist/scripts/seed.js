"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed script — creates demo accounts and sample incidents
 * Run: npx ts-node src/scripts/seed.ts
 */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const User_model_1 = require("../models/User.model");
const Incident_model_1 = require("../models/Incident.model");
const helpers_1 = require("../utils/helpers");
const DEMO_USERS = [
    { name: 'Demo Citizen', email: 'demo@awaazsetu.ai', password: 'Demo@1234', role: 'citizen', preferredLanguage: 'hi-IN' },
    { name: 'Admin User', email: 'admin@awaazsetu.ai', password: 'Admin@1234', role: 'admin', preferredLanguage: 'hi-IN' },
];
const SAMPLE_INCIDENTS = [
    {
        category: 'Water Leakage', severity: 'High',
        description: 'Major pipeline burst near Gandhi Nagar main road flooding the street',
        location: { name: 'Gandhi Nagar, Sector 5', verified: true },
        urgencyReason: 'Water accumulation blocking traffic and may damage road structure',
        recommendedAction: 'Dispatch water department repair team immediately',
        originalTranscript: 'गांव की मुख्य सड़क पर पानी की पाइपलाइन फूट गई है और पानी बह रहा है',
        language: 'hi-IN', confidence: 0.91, status: 'Submitted',
    },
    {
        category: 'Road Damage', severity: 'Critical',
        description: 'Deep pothole on NH-48 causing accidents, multiple vehicles damaged',
        location: { name: 'NH-48 near Toll Plaza, Km 245', verified: true },
        urgencyReason: 'Critical safety hazard causing accidents and vehicle damage on national highway',
        recommendedAction: 'Emergency road repair required immediately, place warning signs',
        originalTranscript: 'Highway pe bada sa gadha hai, kai gadiyan phans gayi hain aaj',
        language: 'hi-IN', confidence: 0.88, status: 'Under Review',
    },
    {
        category: 'Electrical Hazard', severity: 'Critical',
        description: 'Exposed live wires hanging low after storm damage near school',
        location: { name: 'Near Government Primary School, Sector 12', verified: true },
        urgencyReason: 'Immediate life threat — exposed live wires at accessible height near school',
        recommendedAction: 'Emergency response from electricity board, cordon off area immediately',
        originalTranscript: 'School ke paas bijli ke taar neeche aa gaye hain, bahut khatrnaak hai',
        language: 'hi-IN', confidence: 0.95, status: 'In Progress',
    },
    {
        category: 'Waste Management', severity: 'Medium',
        description: 'Garbage pile not collected for over 2 weeks near residential area',
        location: { name: 'Ward 7, Rajiv Nagar Colony', verified: true },
        urgencyReason: 'Health hazard due to decomposing garbage, mosquito breeding risk',
        recommendedAction: 'Schedule immediate garbage collection and increase frequency',
        originalTranscript: 'Hamare colony mein 2 hafte se kachra nahi utha, bahut buri smell aa rahi hai',
        language: 'hi-IN', confidence: 0.87, status: 'Resolved',
    },
    {
        category: 'Drainage Problem', severity: 'High',
        description: 'Blocked drainage causing waterlogging across entire market area after rain',
        location: { name: 'Subzi Mandi, Old City Area', verified: true },
        urgencyReason: 'Waterlogging affecting business and creating disease risk',
        recommendedAction: 'Clear drainage blockage and clean the nala',
        originalTranscript: 'Mandi mein paani bhar gaya hai, naala jam gaya hai',
        language: 'hi-IN', confidence: 0.89, status: 'Assigned',
    },
];
async function seed() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Seed users
        for (const u of DEMO_USERS) {
            const exists = await User_model_1.User.findOne({ email: u.email });
            if (exists) {
                console.log(`   User ${u.email} already exists, skipping`);
                continue;
            }
            await User_model_1.User.create({ name: u.name, email: u.email, passwordHash: u.password, role: u.role, preferredLanguage: u.preferredLanguage });
            console.log(`✅ Created user: ${u.email}`);
        }
        // Get citizen user id
        const citizen = await User_model_1.User.findOne({ email: 'demo@awaazsetu.ai' });
        if (!citizen)
            throw new Error('Citizen user not found after creation');
        // Seed incidents
        for (const inc of SAMPLE_INCIDENTS) {
            const incidentId = (0, helpers_1.generateIncidentId)();
            await Incident_model_1.Incident.create({
                incidentId,
                userId: citizen._id,
                ...inc,
                missingInformation: [],
                verificationStatus: 'verified',
                verifiedAt: new Date(),
            });
            console.log(`✅ Created incident: ${incidentId} — ${inc.category}`);
        }
        console.log('\n🎉 Seed complete!');
        console.log('\nDemo accounts:');
        console.log('  Citizen: demo@awaazsetu.ai / Demo@1234');
        console.log('  Admin:   admin@awaazsetu.ai / Admin@1234');
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map