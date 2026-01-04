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
            // Sign in using Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                console.error('Authentication error:', authError);
                return { success: false, message: 'ভুল ইমেইল বা পাসওয়ার্ড' };
            }

            if (authData.user) {
                // Fetch admin profile from the 'admins' table
                const { data: adminData, error: profileError } = await supabase
                    .from(DB_TABLES.ADMINS)
                    .select('id, name, role')
                    .eq('email', email)
                    .single();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    // Log out the user if profile not found
                    await supabase.auth.signOut();
                    return { success: false, message: 'অ্যাডমিন প্রোফাইল পাওয়া যায়নি' };
                }

                // Store admin details in local storage
                storage.set('admin', {
                    id: adminData.id,
                    email: authData.user.email,
                    name: adminData.name,
                    role: adminData.role,
                    loginTime: Date.now()
                });
                storage.set('isAdminLoggedIn', true);
                
                return { success: true, data: { ...authData.user, ...adminData } };
            }

            return { success: false, message: 'অজানা একটি ত্রুটি ঘটেছে' };
        } catch (error) {
            console.error('Login process error:', error);
            return { success: false, message: 'লগইন প্রক্রিয়ায় ত্রুটি' };
        }
    },

    async isAdminLoggedIn() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            storage.remove('admin');
            storage.remove('isAdminLoggedIn');
            return false;
        }

        const admin = storage.get('admin');
        if (!admin) {
            const { data: adminData, error } = await supabase
                .from(DB_TABLES.ADMINS)
                .select('id, name, role')
                .eq('email', session.user.email)
                .single();
            
            if (error) {
                console.error("Failed to refetch admin profile", error);
                await this.logoutAdmin();
                return false;
            }

            storage.set('admin', {
                id: adminData.id,
                email: session.user.email,
                name: adminData.name,
                role: adminData.role,
                loginTime: Date.now()
            });
        }
        
        storage.set('isAdminLoggedIn', true);
        return true;
    },

    getCurrentAdmin() {
        return storage.get('admin');
    },

    async logoutAdmin() {
        await supabase.auth.signOut();
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

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.ORDERS)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async update(id, orderData) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.ORDERS)
                .update({
                    ...orderData,
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

// Admins Functions
const admins = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.ADMINS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async create(adminData) {
        try {
            // IMPORTANT: This requires a service_role key to be used securely, typically from a backend.
            // Exposing admin user creation on the client-side is a security risk.
            // The following code assumes it's being run in a secure environment.
            
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: adminData.email,
                password: adminData.password,
                email_confirm: true, // Auto-confirm email
            });

            if (authError) {
                if (authError.message.includes("User already registered")) {
                    return { success: false, message: "এই ইমেইল দিয়ে ஏற்கனவே একজন ব্যবহারকারী আছেন।" };
                }
                throw authError;
            }

            // Then, insert the profile into the 'admins' table
            const profileData = {
                email: adminData.email,
                name: adminData.name,
                role: adminData.role,
                created_at: new Date().toISOString()
                // If your 'admins' table has a foreign key to auth.users, you'd link it here.
                // e.g., user_id: authData.user.id
            };

            const { data, error } = await supabase
                .from(DB_TABLES.ADMINS)
                .insert([profileData])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async update(id, adminData) {
        try {
            const { data, error } = await supabase
                .from(DB_TABLES.ADMINS)
                .update(adminData)
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
            // As with create, this is a sensitive operation.
            // Deleting a user requires the service_role key.
            
            // First get the user's email to identify them in auth
            const { data: adminToDelete, error: getError } = await supabase
                .from(DB_TABLES.ADMINS)
                .select('email')
                .eq('id', id)
                .single();

            if (getError) throw getError;
            
            // This is a placeholder. You can't get a user's ID from their email on the client-side securely.
            // To properly delete, you need the user's UID from auth.users, which you'd have if your
            // 'admins' table linked to it. For now, we will only delete from the 'admins' table.
            
            const { error: deleteError } = await supabase
                .from(DB_TABLES.ADMINS)
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // The next line would be: await supabase.auth.admin.deleteUser(auth_user_id);
            // But we cannot do this securely from the client.

            return { success: true };
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
            // Create initial admin profile (not the user)
            // The user must be created in Supabase Auth separately
            await supabase.from(DB_TABLES.ADMINS).insert([{
                email: INITIAL_ADMIN.email,
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

export { supabase, auth, books, categories, orders, settings, stats, admins };