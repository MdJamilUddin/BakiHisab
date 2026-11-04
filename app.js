/* ============================================
   লগইন / সাইনআপ (Fixed Code)
   ============================================ */
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.authtab + 'Form').classList.remove('hidden');
  });
});

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');
  const btn = document.getElementById('loginBtn');

  btn.disabled = true;
  btn.textContent = 'অপেক্ষা করুন...';
  msg.textContent = '';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error("Login Error:", err.code, err.message); // ডিবাগিং-এর জন্য
    msg.textContent = getAuthError(err.code);
    msg.className = 'auth-msg error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'লগইন করুন';
  }
});

document.getElementById('signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  // ফর্ম থেকে মান নেওয়া
  const shop = document.getElementById('signupShop').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const adminKey = document.getElementById('signupAdminKey')?.value.trim() || '';
  
  const msg = document.getElementById('signupMsg');
  const btn = document.getElementById('signupBtn');

  // পাসওয়ার্ড চেক (কমপক্ষে ৬ অক্ষর)
  if (password.length < 6) {
    msg.textContent = '❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
    msg.className = 'auth-msg error';
    return;
  }

  // অ্যাডমিন কী চেক
  // নোট: এখানে ADMIN_SECRET_KEY ভেরিয়েবলটি আপনার উপরের কোডে ডিফাইন করা আছে
  const role = (adminKey === ADMIN_SECRET_KEY) ? 'admin' : 'user';
  
  // যদি অ্যাডমিন কী লেখা হয় কিন্তু ভুল হয়, তবে আটকে দিন
  if (adminKey !== '' && role !== 'admin') {
    msg.textContent = '❌ অ্যাডমিন কী ভুল! সঠিক কী দিন অথবা ঘরটি খালি রাখুন।';
    msg.className = 'auth-msg error';
    return; // ফর্ম সাবমিট হবে না
  }

  btn.disabled = true;
  btn.textContent = 'অপেক্ষা করুন...';
  msg.textContent = '';

  try {
    // ১. নতুন ইউজার তৈরি
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: shop });

    // ২. ইমেইল ভেরিফিকেশন পাঠানো (ঐচ্ছিক, এরর হলেও অ্যাকাউন্ট তৈরি হবে)
    try {
      await sendEmailVerification(cred.user, {
        url: window.location.origin + '/index.html',
        handleCodeInApp: false
      });
    } catch (evErr) {
      console.warn('Verification email failed:', evErr);
    }

    // ৩. Firestore-এ ইউজারের ডেটা সেভ করা
    await setDoc(doc(db, 'users', cred.user.uid), {
      shopName: shop,
      email: email,
      role: role,
      blocked: false,
      createdAt: new Date().toISOString()
    });

    // সফল মেসেজ
    msg.textContent = '✅ অ্যাকাউন্ট তৈরি হয়েছে! ড্যাশবোর্ডে প্রবেশ করছেন...';
    msg.className = 'auth-msg success';
    
  } catch (err) {
    console.error("Signup Error:", err.code, err.message); // ডিবাগিং-এর জন্য
    msg.textContent = getAuthError(err.code);
    msg.className = 'auth-msg error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'অ্যাকাউন্ট তৈরি করুন';
  }
});
