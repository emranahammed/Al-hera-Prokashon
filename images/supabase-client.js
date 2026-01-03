// supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/+esm';
import { SUPABASE_CONFIG, DB_TABLES, INITIAL_ADMIN, SITE_SETTINGS } from './config.js';

// Create Supabase Client
const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

// Storage helper
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('LocalStorage error:', e);
        }
    },
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            return null;
        }
    },
    remove: (key) => {
        localStorage.removeItem(key);
    }
};

// Auth Functions
const auth = {
    async loginAdmin(email, password) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.ADMINS)
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error) {
                console.error('Login error:', error);
                return { success: false, message: 'ডাটাবেস ত্রুটি' };
            }

            if (data) {
                storage.set('admin', {
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    loginTime: Date.now()
                });
                storage.set('isAdminLoggedIn', true);
                return { success: true, data };
            }

            return { success: false, message: 'ভুল ইমেইল বা পাসওয়ার্ড' };
        } catch (error) {
            return { success: false, message: 'লগইন প্রক্রিয়ায় ত্রুটি' };
        }
    },

    isAdminLoggedIn() {
        const admin = storage.get('admin');
        const isLoggedIn = storage.get('isAdminLoggedIn');
        
        if (!admin || !isLoggedIn) return false;
        
        // Check if session is valid (24 hours)
        const sessionAge = Date.now() - admin.loginTime;
        return sessionAge < (24 * 60 * 60 * 1000);
    },

    getCurrentAdmin() {
        return storage.get('admin');
    },

    logoutAdmin() {
        storage.remove('admin');
        storage.remove('isAdminLoggedIn');
        window.location.href = 'admin-login.html';
    }
};

// Book Functions
const books = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.BOOKS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.BOOKS)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async create(bookData) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.BOOKS)
                .insert([{
                    ...bookData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async update(id, bookData) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.BOOKS)
                .update({
                    ...bookData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async delete(id) {
        try {
            const { error } = await supabase
                .from(DB_TABLES.BOOKS)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async search(query) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.BOOKS)
                .select('*')
                .or(`title.ilike.%${query}%,author.ilike.%${query}%,category.ilike.%${query}%`);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Category Functions
const categories = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.CATEGORIES)
                .select('*')
                .order('name');

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async create(categoryData) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.CATEGORIES)
                .insert([categoryData])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async delete(id) {
        try {
            const { error } = await supabase
                .from(DB_TABLES.CATEGORIES)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Order Functions
const orders = {
    async create(orderData) {
        try {
            const orderId = 'ORD-' + Date.now().toString().slice(-8);
            const completeOrder = {
                ...orderData,
                order_id: orderId,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from(DB_TABLES.ORDERS)
                .insert([completeOrder])
                .select();

            if (error) throw error;
            return { success: true, data: { ...completeOrder, id: data[0].id } };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async getAll() {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.ORDERS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateStatus(id, status) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.ORDERS)
                .update({ status })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Settings Functions
const settings = {
    async get() {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.SETTINGS)
                .select('*')
                .single();

            if (error) {
                // Return default settings if not found
                return { success: true, data: SITE_SETTINGS };
            }
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async update(settingsData) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.SETTINGS)
                .upsert([settingsData])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Stats Functions
const stats = {
    async getDashboardStats() {
        try {
            const [booksRes, ordersRes] = await Promise.all([
                supabase.from(DB_TABLES.BOOKS).select('id'),
                supabase.from(DB_TABLES.ORDERS).select('id,total_amount')
            ]);

            const totalBooks = booksRes.data?.length || 0;
            const totalOrders = ordersRes.data?.length || 0;
            const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

            return {
                success: true,
                data: { totalBooks, totalOrders, totalRevenue }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Initialize Database
async function initDatabase() {
    try {
        // Check if admins table has data
        const { data: admins } = await supabase
            .from(DB_TABLES.ADMINS)
            .select('*')
            .limit(1);

        if (!admins || admins.length === 0) {
            // Create initial admin
            await supabase.from(DB_TABLES.ADMINS).insert([{
                email: INITIAL_ADMIN.email,
                password: INITIAL_ADMIN.password,
                name: INITIAL_ADMIN.name,
                role: 'super_admin',
                created_at: new Date().toISOString()
            }]);
        }

        // Create default categories if not exist
        const { data: existingCategories } = await supabase
            .from(DB_TABLES.CATEGORIES)
            .select('*');

        if (!existingCategories || existingCategories.length === 0) {
            const defaultCategories = [
                { name: 'ইসলামিক', icon: 'fas fa-mosque' },
                { name: 'ইতিহাস', icon: 'fas fa-landmark' },
                { name: 'সাহিত্য', icon: 'fas fa-book-open' },
                { name: 'বিজ্ঞান', icon: 'fas fa-flask' },
                { name: 'শিক্ষামূলক', icon: 'fas fa-graduation-cap' },
                { name: 'শিশুতোষ', icon: 'fas fa-child' }
            ];

            for (const category of defaultCategories) {
                await supabase.from(DB_TABLES.CATEGORIES).insert([category]);
            }
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// Call initialization
initDatabase();

export { supabase, auth, books, categories, orders, settings, stats };