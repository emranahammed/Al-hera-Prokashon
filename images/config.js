// config.js
const SUPABASE_CONFIG = {
    URL: 'https://wzttsaydwtrncagpfcrf.supabase.co',
    // অনুগ্রহ করে এখানে আপনার সুপাবেস প্রকল্পের আসল Public Anonymous Key যোগ করুন।
    // আপনার কী (Key) টি সুপাবেস ড্যাশবোর্ডের API সেটিংসে পাবেন।
    KEY: 'sb_publishable_EaBtQXNvy_6OFrpCz7J9ww_XfZdAbIS'
};

const DB_TABLES = {
    BOOKS: 'books',
    CATEGORIES: 'categories',
    ORDERS: 'orders',
    ADMINS: 'admins',
    SETTINGS: 'settings'
};

const INITIAL_ADMIN = {
    email: 'admin@alhera.com',
    password: 'Admin@123',
    name: 'সুপার অ্যাডমিন'
};

const SITE_SETTINGS = {
    title: 'আল হেরা প্রকাশন',
    description: 'ইসলামিক বইয়ের এক বিশাল সংগ্রহশালা',
    contact_email: 'support@alhera.com',
    contact_phone: '+৮৮০ ১৭১২-৩৪৫৬৭৮',
    delivery_charge: 60,
    free_delivery_amount: 500,
    currency: '৳'
};

export { SUPABASE_CONFIG, DB_TABLES, INITIAL_ADMIN, SITE_SETTINGS };