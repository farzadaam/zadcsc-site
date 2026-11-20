/* Zad CSC — account, car finder, booking (loaded after the main script) */
(function(){
const T2={
fa:{nav_car:"خودروی من",hero_cta3:"جستجو با VIN / مدل خودرو",hero_cta4:"رزرو نوبت",car_p:"VIN یا مدل خودرو را وارد کنید تا روغن و سایز تایر مناسب را ببینید.",
vin_h:"جستجو با شماره شاسی (VIN)",vin_hint:"VIN عدد ۱۷ رقمی روی کارت خودرو (ملکیه) یا پایین شیشه‌ی جلوست.",mm_h:"یا انتخاب دستی مدل",make:"برند",model:"مدل",year:"سال",
bk_p:"زمان مراجعه را انتخاب کنید؛ تأیید نوبت را در واتساپ دریافت می‌کنید.",f_name:"نام",f_service:"نوع خدمت",f_date:"تاریخ",f_time:"ساعت",f_note:"توضیحات",bk_send:"ثبت نوبت",bk_ok:"نوبت شما ثبت شد. به‌زودی برای تأیید تماس می‌گیریم.",
acct_h:"حساب کاربری",acct_p:"سوابق خودرو، سرویس‌ها، سفارش‌ها و نوبت‌های شما.",login:"ورود",register:"ثبت‌نام",password:"رمز عبور",email:"ایمیل (اختیاری)",logout:"خروج",
my_vehicles:"خودروهای من",add_vehicle:"افزودن خودرو",plate:"پلاک",mileage:"کیلومتر",svc_history:"سابقه‌ی سرویس",my_orders:"سفارش‌ها",my_bookings:"نوبت‌ها",reminders:"سرویس‌های پیش رو",
due_on:"موعد",no_items:"موردی ثبت نشده است.",save:"ذخیره",my_profile:"اطلاعات من",new_password:"رمز جدید (اختیاری)",del:"حذف",
car_found:"خودروی شناسایی‌شده",oil_rec:"روغن پیشنهادی",tire_rec:"سایز تایرهای کارخانه",no_fit:"اطلاعات این مدل هنوز در سیستم نیست؛ در واتساپ بپرسید تا راهنمایی‌تان کنیم.",
ws_h:"سایز دقیق بر اساس تیپ خودرو",ws_stock:"کارخانه",ws_opt:"اختیاری",ws_src:"منبع سایزها",ig_h:"از اینستاگرام ما",ig_f:"دنبال کنید",bk_wa:"ارسال نوبت در واتساپ",e_too_many_attempts:"تلاش زیاد؛ ۱۵ دقیقه دیگر دوباره امتحان کنید.",forgot:"رمز را فراموش کرده‌اید؟ در واتساپ پیام دهید تا رمز جدید بگیرید.",fit_note:"اطلاعات مرجع است؛ لطفاً با دفترچه‌ی خودرو و برچسب در راننده تطبیق دهید.",engine:"موتور",body:"بدنه",show_tires:"نمایش تایرها",ask_oil:"استعلام روغن",
date:"تاریخ",type:"نوع",details:"جزئیات",price:"مبلغ",status:"وضعیت",items:"اقلام",admin_link:"پنل مدیریت",select:"انتخاب کنید",
st_new:"جدید",st_confirmed:"تأییدشده",st_processing:"در حال انجام",st_done:"انجام‌شده",st_delivered:"تحویل‌شده",st_cancelled:"لغوشده",
svc_tire:"تعویض / نصب تایر",svc_oil:"تعویض روغن",svc_balance:"بالانس و تنظیم فرمان",svc_check:"بازدید و مشاوره",svc_other:"سایر",
e_invalid_phone:"شماره موبایل معتبر نیست.",e_password_short:"رمز باید حداقل ۶ کاراکتر باشد.",e_phone_taken:"این شماره قبلاً ثبت شده؛ وارد شوید.",e_wrong_login:"شماره یا رمز اشتباه است.",e_name_required:"نام را وارد کنید.",e_invalid_vin:"VIN باید ۱۷ کاراکتر باشد (بدون I، O، Q).",e_generic:"خطایی رخ داد؛ دوباره تلاش کنید.",e_invalid_datetime:"تاریخ و ساعت را انتخاب کنید.",
save_car:"ذخیره در حساب من",saved:"ذخیره شد.",vin_pick:"مدل دقیق از روی VIN مشخص نشد؛ لطفاً مدل و سال را از فهرست بالا انتخاب کنید."},
ar:{nav_car:"سيارتي",hero_cta3:"ابحث برقم الشاصي / الطراز",hero_cta4:"احجز موعداً",car_p:"أدخل رقم الشاصي أو طراز السيارة لترى الزيت ومقاس الإطار المناسب.",
vin_h:"البحث برقم الشاصي (VIN)",vin_hint:"رقم VIN مكوّن من 17 خانة، موجود في ملكية السيارة أو أسفل الزجاج الأمامي.",mm_h:"أو اختر الطراز يدوياً",make:"العلامة",model:"الطراز",year:"السنة",
bk_p:"اختر موعد الزيارة؛ ستصلك رسالة التأكيد عبر واتساب.",f_name:"الاسم",f_service:"نوع الخدمة",f_date:"التاريخ",f_time:"الوقت",f_note:"ملاحظات",bk_send:"تأكيد الحجز",bk_ok:"تم تسجيل موعدك. سنتواصل معك قريباً للتأكيد.",
acct_h:"حسابي",acct_p:"سجل سياراتك وخدماتك وطلباتك ومواعيدك.",login:"تسجيل الدخول",register:"إنشاء حساب",password:"كلمة المرور",email:"البريد (اختياري)",logout:"خروج",
my_vehicles:"سياراتي",add_vehicle:"إضافة سيارة",plate:"اللوحة",mileage:"العداد (كم)",svc_history:"سجل الخدمات",my_orders:"الطلبات",my_bookings:"المواعيد",reminders:"الخدمات القادمة",
due_on:"الموعد",no_items:"لا توجد بيانات.",save:"حفظ",my_profile:"بياناتي",new_password:"كلمة مرور جديدة (اختياري)",del:"حذف",
car_found:"السيارة",oil_rec:"الزيت الموصى به",tire_rec:"مقاسات الإطارات الأصلية",no_fit:"بيانات هذا الطراز غير متوفرة بعد؛ اسألنا عبر واتساب.",
ws_h:"المقاسات حسب فئة السيارة",ws_stock:"أصلي",ws_opt:"اختياري",ws_src:"مصدر المقاسات",ig_h:"من إنستغرامنا",ig_f:"تابعونا",bk_wa:"إرسال الحجز عبر واتساب",e_too_many_attempts:"محاولات كثيرة؛ حاول بعد ١٥ دقيقة.",forgot:"نسيت كلمة المرور؟ راسلنا على واتساب لتعيينها.",fit_note:"البيانات مرجعية؛ يرجى مطابقتها مع دليل السيارة وملصق باب السائق.",engine:"المحرك",body:"الهيكل",show_tires:"عرض الإطارات",ask_oil:"استفسر عن الزيت",
date:"التاريخ",type:"النوع",details:"التفاصيل",price:"المبلغ",status:"الحالة",items:"العناصر",admin_link:"لوحة الإدارة",select:"اختر",
st_new:"جديد",st_confirmed:"مؤكد",st_processing:"قيد التنفيذ",st_done:"منجز",st_delivered:"تم التسليم",st_cancelled:"ملغى",
svc_tire:"تغيير / تركيب إطارات",svc_oil:"تغيير الزيت",svc_balance:"ترصيص وضبط الأذرعة",svc_check:"فحص واستشارة",svc_other:"أخرى",
e_invalid_phone:"رقم الهاتف غير صحيح.",e_password_short:"كلمة المرور 6 أحرف على الأقل.",e_phone_taken:"الرقم مسجّل مسبقاً؛ سجّل الدخول.",e_wrong_login:"الرقم أو كلمة المرور غير صحيحة.",e_name_required:"أدخل الاسم.",e_invalid_vin:"رقم VIN يجب أن يكون 17 خانة (بدون I وO وQ).",e_generic:"حدث خطأ؛ حاول مجدداً.",e_invalid_datetime:"اختر التاريخ والوقت.",
save_car:"حفظ في حسابي",saved:"تم الحفظ.",vin_pick:"لم يتحدد الطراز من رقم VIN؛ اختر الطراز والسنة من القائمة أعلاه."},
en:{nav_car:"My car",hero_cta3:"Search by VIN / model",hero_cta4:"Book a visit",car_p:"Enter your VIN or car model to see the right oil and tire sizes.",
vin_h:"Search by VIN",vin_hint:"The 17-character VIN is on your registration card (Mulkiya) or at the bottom of the windscreen.",mm_h:"Or choose your model",make:"Make",model:"Model",year:"Year",
bk_p:"Pick a time to visit; you'll get the confirmation on WhatsApp.",f_name:"Name",f_service:"Service",f_date:"Date",f_time:"Time",f_note:"Notes",bk_send:"Book now",bk_ok:"Your booking is in. We'll contact you shortly to confirm.",
acct_h:"My account",acct_p:"Your vehicles, service history, orders and bookings.",login:"Sign in",register:"Create account",password:"Password",email:"Email (optional)",logout:"Sign out",
my_vehicles:"My vehicles",add_vehicle:"Add vehicle",plate:"Plate",mileage:"Mileage (km)",svc_history:"Service history",my_orders:"Orders",my_bookings:"Bookings",reminders:"Upcoming services",
due_on:"Due",no_items:"Nothing yet.",save:"Save",my_profile:"My details",new_password:"New password (optional)",del:"Delete",
car_found:"Vehicle",oil_rec:"Recommended oil",tire_rec:"Factory tire sizes",no_fit:"We don't have this model on file yet — ask us on WhatsApp.",
ws_h:"Exact sizes by trim",ws_stock:"OE",ws_opt:"Option",ws_src:"Sizes source",ig_h:"From our Instagram",ig_f:"Follow us",bk_wa:"Send booking on WhatsApp",e_too_many_attempts:"Too many attempts — try again in 15 minutes.",forgot:"Forgot your password? Message us on WhatsApp to reset it.",fit_note:"Reference data — please check against your owner's manual and door-jamb sticker.",engine:"Engine",body:"Body",show_tires:"Show tires",ask_oil:"Ask about oil",
date:"Date",type:"Type",details:"Details",price:"Amount",status:"Status",items:"Items",admin_link:"Admin panel",select:"Select",
st_new:"New",st_confirmed:"Confirmed",st_processing:"In progress",st_done:"Done",st_delivered:"Delivered",st_cancelled:"Cancelled",
svc_tire:"Tire change / fitting",svc_oil:"Oil change",svc_balance:"Balancing & alignment",svc_check:"Inspection & advice",svc_other:"Other",
e_invalid_phone:"Invalid phone number.",e_password_short:"Password must be at least 6 characters.",e_phone_taken:"This number is already registered — sign in.",e_wrong_login:"Wrong number or password.",e_name_required:"Enter your name.",e_invalid_vin:"VIN must be 17 characters (no I, O or Q).",e_generic:"Something went wrong — please try again.",e_invalid_datetime:"Choose a date and time.",
save_car:"Save to my account",saved:"Saved.",vin_pick:"The exact model couldn't be read from this VIN — please pick the model and year above."}
};
Object.keys(T2).forEach(l=>Object.assign(T[l],T2[l]));
const SVC=["tire","oil","balance","check","other"];
const errT=e=>t("e_"+e)!=="e_"+e?t("e_"+e):t("e_generic");
async function call(path,opt={}){
  const r=await fetch(path,{credentials:"same-origin",headers:{"content-type":"application/json"},...opt,body:opt.body?JSON.stringify(opt.body):undefined});
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error(j.error||"generic");
  return j;
}
const msg=(el,ok,text)=>{el.className="msg "+(ok?"ok":"err");el.textContent=text};
const pill=s=>`<span class="pill ${esc(s)}">${esc(t("st_"+s))}</span>`;
const fd=f=>Object.fromEntries(new FormData(f).entries());
window.ME=null;

/* ---------- account ---------- */
async function loadMe(){try{window.ME=await call("/api/me")}catch(e){window.ME=null}$("#acctDot").style.display=ME?"grid":"none";return ME}
window.renderAccount=async function(){
  const w=$("#acctWrap");w.innerHTML="…";
  await loadMe();
  if(!ME){return renderAuth(w)}
  const u=ME.user, vmap=Object.fromEntries(ME.vehicles.map(v=>[v.id,v]));
  const vname=v=>v?[v.make,v.model,v.year].filter(Boolean).join(" ")+(v.plate?` (${v.plate})`:""):"";
  const due=ME.services.filter(s=>s.next_due_date||s.next_due_km);
  w.innerHTML=`
  <div class="box2"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
    <div><b style="font-size:20px">${esc(u.name)}</b><div style="direction:ltr;text-align:start;color:var(--sub)">+${esc(u.phone)}</div></div>
    <div style="display:flex;gap:8px">${u.role==="admin"?`<a class="btn d" href="/admin">${t("admin_link")}</a>`:""}<button class="btn o" style="color:var(--txt);border-color:#ccc" id="logoutBtn">${t("logout")}</button></div></div></div>
  ${due.length?`<div class="box2"><h3>${t("reminders")}</h3>${due.map(s=>`<div class="due"><b>${esc(t("svc_"+s.type)||s.type)}</b> — ${esc(vname(vmap[s.vehicle_id]))}<br>${t("due_on")}: ${s.next_due_date?esc(fmtDate(s.next_due_date)):""} ${s.next_due_km?` · ${s.next_due_km.toLocaleString()} km`:""}</div>`).join("")}<a class="btn y" href="#/booking">${t("hero_cta4")}</a></div>`:""}
  <div class="box2"><h3>${t("my_vehicles")}</h3>
    ${ME.vehicles.length?`<table class="lst"><tr><th>${t("vehicle")}</th><th>VIN</th><th>${t("mileage")}</th><th></th></tr>${ME.vehicles.map(v=>`<tr><td>${esc(vname(v))}</td><td style="direction:ltr">${esc(v.vin||"")}</td><td>${v.mileage?v.mileage.toLocaleString():""}</td><td><a href="#/car" data-carv="${v.id}" class="more">${t("tire_rec")}</a> · <a href="#" data-delv="${v.id}" style="color:#a33">${t("del")}</a></td></tr>`).join("")}</table>`:`<p class="empty2">${t("no_items")}</p>`}
    <form id="addVeh" style="margin-top:14px"><div class="fg2">
      <div class="fld"><label>VIN</label><input name="vin" class="ltrin" maxlength="17"></div>
      <div class="fld"><label>${t("make")}</label><input name="make"></div>
      <div class="fld"><label>${t("model")}</label><input name="model"></div>
      <div class="fld"><label>${t("year")}</label><input name="year" type="number" min="1980" max="2030"></div>
      <div class="fld"><label>${t("plate")}</label><input name="plate"></div>
      <div class="fld"><label>${t("mileage")}</label><input name="mileage" type="number"></div>
    </div><button class="btn y" style="margin-top:10px">+ ${t("add_vehicle")}</button><div class="msg" id="vehMsg"></div></form></div>
  <div class="box2"><h3>${t("svc_history")}</h3>${ME.services.length?`<table class="lst"><tr><th>${t("date")}</th><th>${t("vehicle")}</th><th>${t("type")}</th><th>${t("mileage")}</th><th>${t("details")}</th></tr>${ME.services.map(s=>`<tr><td>${esc(fmtDate(s.date))}</td><td>${esc(vname(vmap[s.vehicle_id]))}</td><td>${esc(t("svc_"+s.type)||s.type)}</td><td>${s.mileage?s.mileage.toLocaleString():""}</td><td>${esc(s.details||"")}</td></tr>`).join("")}</table>`:`<p class="empty2">${t("no_items")}</p>`}</div>
  <div class="box2"><h3>${t("my_orders")}</h3>${ME.orders.length?`<table class="lst"><tr><th>#</th><th>${t("date")}</th><th>${t("items")}</th><th>${t("status")}</th></tr>${ME.orders.map(o=>`<tr><td>${o.id}</td><td>${esc(fmtDate(o.created_at))}</td><td style="direction:ltr;text-align:start">${o.items.map(i=>esc(`${i.name} ${i.size} ×${i.qty}`)).join("<br>")}</td><td>${pill(o.status)}</td></tr>`).join("")}</table>`:`<p class="empty2">${t("no_items")}</p>`}</div>
  <div class="box2"><h3>${t("my_bookings")}</h3>${ME.bookings.length?`<table class="lst"><tr><th>${t("date")}</th><th>${t("f_service")}</th><th>${t("vehicle")}</th><th>${t("status")}</th></tr>${ME.bookings.map(b=>`<tr><td>${esc(fmtDate(b.date))} ${esc(b.time)}</td><td>${esc(t("svc_"+b.service)||b.service)}</td><td>${esc(b.vehicle||"")}</td><td>${pill(b.status)}</td></tr>`).join("")}</table>`:`<p class="empty2">${t("no_items")}</p>`}</div>
  <form class="box2" id="profForm"><h3>${t("my_profile")}</h3><div class="fg2">
    <div class="fld"><label>${t("f_name")}</label><input name="name" value="${esc(u.name)}"></div>
    <div class="fld"><label>${t("email")}</label><input name="email" type="email" class="ltrin" value="${esc(u.email||"")}"></div>
    <div class="fld"><label>${t("new_password")}</label><input name="new_password" type="password" autocomplete="new-password"></div>
  </div><button class="btn y" style="margin-top:10px">${t("save")}</button><div class="msg" id="profMsg"></div></form>`;
  $("#logoutBtn").onclick=async()=>{await call("/api/auth/logout",{method:"POST"}).catch(()=>{});renderAccount()};
  $("#addVeh").onsubmit=async e=>{e.preventDefault();const b=fd(e.target);try{await call("/api/me/vehicles",{method:"POST",body:b});renderAccount()}catch(er){msg($("#vehMsg"),0,errT(er.message))}};
  $("#profForm").onsubmit=async e=>{e.preventDefault();try{await call("/api/me",{method:"PUT",body:fd(e.target)});msg($("#profMsg"),1,t("saved"))}catch(er){msg($("#profMsg"),0,errT(er.message))}};
  w.querySelectorAll("[data-delv]").forEach(a=>a.onclick=async e=>{e.preventDefault();await call("/api/me/vehicles/"+a.dataset.delv,{method:"DELETE"}).catch(()=>{});renderAccount()});
  w.querySelectorAll("[data-carv]").forEach(a=>a.onclick=()=>{const v=vmap[a.dataset.carv];window.__carPrefill=v});
};
function renderAuth(w){
  let mode="login";
  const draw=()=>{w.innerHTML=`<div class="box2" style="max-width:480px;margin:0 auto">
    <div class="tabs2"><button data-m="login" class="${mode==="login"?"on":""}">${t("login")}</button><button data-m="register" class="${mode==="register"?"on":""}">${t("register")}</button></div>
    <form id="authForm"><div class="fg2" style="grid-template-columns:1fr">
      ${mode==="register"?`<div class="fld"><label>${t("f_name")}</label><input name="name" required></div>`:""}
      <div class="fld"><label>${t("phone")}</label><input name="phone" class="ltrin" inputmode="tel" required placeholder="9XXXXXXX"></div>
      <div class="fld"><label>${t("password")}</label><input name="password" type="password" required minlength="6" autocomplete="${mode==="login"?"current-password":"new-password"}"></div>
      ${mode==="register"?`<div class="fld"><label>${t("email")}</label><input name="email" type="email" class="ltrin"></div>`:""}
    </div><button class="btn y" style="margin-top:12px;width:100%;justify-content:center">${t(mode)}</button><div class="msg" id="authMsg"></div>${mode==="login"?`<p style="margin-top:10px;font-size:13px"><a target="_blank" rel="noopener" href="${waURL(t("wa_hi")+" — "+t("forgot"))}">${t("forgot")}</a></p>`:""}</form></div>`;
    w.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{mode=b.dataset.m;draw()});
    $("#authForm").onsubmit=async e=>{e.preventDefault();try{await call("/api/auth/"+mode,{method:"POST",body:fd(e.target)});renderAccount()}catch(er){msg($("#authMsg"),0,errT(er.message))}};
  };draw();
}

/* ---------- car finder ---------- */
let MAKES=null;const MODELS={};
const YEARS=(()=>{const a=[];for(let y=new Date().getFullYear()+1;y>=1980;y--)a.push(y);return a})();
async function modelsFor(make){if(!make)return[];if(!MODELS[make]){try{MODELS[make]=await call("/api/car-models?make="+encodeURIComponent(make))}catch(e){MODELS[make]=[]}}return MODELS[make]}
window.initCar=async function(){
  if(!MAKES){try{MAKES=await call("/api/car-makes")}catch(e){MAKES=[]}}
  const mk=$("#mkSel"),md=$("#mdSel"),yr=$("#yrSel");
  const fill=(el,arr,cur)=>{el.innerHTML=`<option value="">${t("select")}</option>`+arr.map(v=>`<option${v==cur?" selected":""}>${esc(v)}</option>`).join("")};
  const upd=async()=>{const cur=md.value;fill(md,[],"");if(mk.value){md.disabled=true;fill(md,await modelsFor(mk.value),cur);md.disabled=false}};
  if(!mk.options.length||mk.dataset.l!==L){fill(mk,MAKES,mk.value);fill(yr,YEARS,yr.value);mk.dataset.l=L;await upd()}
  mk.onchange=()=>{md.value="";upd()};
  $("#mmGo").onclick=async()=>{if(!mk.value)return;const q=new URLSearchParams({make:mk.value,model:md.value,year:yr.value});const f=await call("/api/fitments?"+q).catch(()=>[]);showCar({make:mk.value,model:md.value,year:+yr.value||null},f)};
  $("#vinGo").onclick=async()=>{const v=$("#vinIn").value.trim().toUpperCase();$("#carRes").innerHTML="…";try{const r=await call("/api/vin/"+encodeURIComponent(v));
    if(r.car.make&&MAKES.includes(r.car.make)){mk.value=r.car.make;await upd();if(r.car.model){const ms=await modelsFor(r.car.make);const hit=ms.find(m=>m.toLowerCase()===String(r.car.model).toLowerCase());if(hit)md.value=hit}if(r.car.year)yr.value=r.car.year}
    if(!r.car.model&&r.fitments.length>3){
      $("#carRes").innerHTML=`<div class="box2"><h3>${t("car_found")}: <span style="direction:ltr;display:inline-block">${esc([r.car.make,r.car.year].filter(Boolean).join(" ")||"—")}</span></h3><p class="empty2">${t("vin_pick")}</p></div>`;mk.scrollIntoView({behavior:"smooth",block:"center"});return}
    showCar(r.car,r.fitments)}catch(er){$("#carRes").innerHTML=`<div class="msg err">${esc(errT(er.message))}</div>`}};
  $("#vinIn").onkeydown=e=>{if(e.key==="Enter")$("#vinGo").click()};
  if(window.__carPrefill){const v=window.__carPrefill;window.__carPrefill=null;if(v.vin){$("#vinIn").value=v.vin;$("#vinGo").click()}else if(v.make){mk.value=v.make;await upd();md.value=v.model||"";yr.value=v.year||"";$("#mmGo").click()}}
};
function showCar(car,fits){
  const name=[car.make,car.model,car.year].filter(Boolean).join(" ");
  const sizes=[...new Set(fits.flatMap(f=>f.tire_sizes||[]))];
  const oils=[...new Set(fits.map(f=>f.oil_grade).filter(Boolean))];
  $("#carRes").innerHTML=`<div class="box2"><h3>${t("car_found")}: <span style="direction:ltr;display:inline-block">${esc(name||"—")}</span></h3>
    <dl class="kv">${car.vin?`<dt>VIN</dt><dd>${esc(car.vin)}</dd>`:""}${car.engine?`<dt>${t("engine")}</dt><dd>${esc(car.engine)}</dd>`:""}${car.body?`<dt>${t("body")}</dt><dd>${esc(car.body)}</dd>`:""}</dl>
    ${fits.length?`<div class="car-res">
      <div><h3>${t("oil_rec")}</h3>${fits.map(f=>`<div style="margin-bottom:8px"><span class="chipbtn" style="cursor:default">${esc(f.oil_grade||"—")}</span> <small style="color:var(--sub)">${esc([f.engine,f.year_from+"–"+f.year_to,f.notes].filter(Boolean).join(" · "))}${f.oil_capacity_l?` · ${f.oil_capacity_l} L`:""}</small></div>`).join("")}
        <a class="btn wa" target="_blank" rel="noopener" href="${waURL(t("wa_oil")+" "+oils.join(" / ")+" — "+name)}">${t("ask_oil")}</a></div>
      <div><h3>${t("tire_rec")}</h3>${sizes.map(s=>`<span class="chipbtn" data-size="${esc(s.replace(/^(\d+\/\d+)R(\d+)$/,"$1R$2"))}">${esc(s)}</span>`).join("")}
        <p class="disclaim">${t("allsz_p")}</p></div></div>
      <p class="disclaim">${t("fit_note")}</p>
      ${ME&&car.vin?`<button class="btn o" style="color:var(--txt);border-color:#ccc;margin-top:10px" id="saveCar">${t("save_car")}</button>`:""}`
    :`<p class="empty2">${t("no_fit")}</p><a class="btn wa" target="_blank" rel="noopener" href="${waURL(t("wa_hi")+" "+(car.vin||name))}">WhatsApp</a>`}</div>`;
  wsFill(car);
  const sc=$("#saveCar");if(sc)sc.onclick=async()=>{await call("/api/me/vehicles",{method:"POST",body:{vin:car.vin,make:car.make,model:car.model,year:car.year}}).catch(()=>{});sc.textContent=t("saved");sc.disabled=true};
  $("#carRes").querySelectorAll("[data-size]").forEach(b=>b.addEventListener("click",()=>{location.hash="#/tires"},{once:false}));
}

async function wsFill(car){
  if(!car.make||!car.model||!car.year)return;
  const r=await call("/api/ws?"+new URLSearchParams({make:car.make,model:car.model,year:car.year})).catch(()=>null);
  if(!r||!r.enabled||!r.trims||!r.trims.length)return;
  const box=document.createElement("div");box.className="box2";box.style.marginTop="12px";
  box.innerHTML=`<h3>${t("ws_h")}</h3>`+r.trims.map(x=>`<div style="margin-bottom:10px"><b style="direction:ltr;display:inline-block">${esc([x.generation,x.trim,x.engine].filter(Boolean).join(" · "))}</b>${x.bolt?` <small style="color:var(--sub)">· ${esc(x.bolt)}</small>`:""}<div>${x.wheels.map(w=>`<span class="chipbtn" style="cursor:default;direction:ltr">${esc(w.front)}${w.rear?" / "+esc(w.rear):""}${w.rim?` <small>${esc(w.rim)}</small>`:""} <small>${w.stock?t("ws_stock"):t("ws_opt")}</small></span>`).join("")}</div></div>`).join("")+`<p class="disclaim">${t("ws_src")}: <a href="https://www.wheel-size.com" target="_blank" rel="noopener">Wheel-Size.com</a></p>`;
  const res=$("#carRes");if(res)res.appendChild(box);
}

/* ---------- instagram posts (links added in admin) ---------- */
async function loadInsta(){
  const sec=$("#igSec");if(!sec)return;
  $("#igH").textContent=t("ig_h");$("#igF").textContent=t("ig_f")+" ←".replace("←",document.dir==="ltr"?"→":"←");
  if(sec.dataset.done)return;sec.dataset.done=1;
  const l=await call("/api/insta").catch(()=>[]);if(!l||!l.length)return;
  $("#igGrid").innerHTML=l.map(p=>`<blockquote class="instagram-media" data-instgrm-permalink="${esc(p.url)}?utm_source=ig_embed" data-instgrm-version="14"><a href="${esc(p.url)}" target="_blank" rel="noopener">Instagram</a></blockquote>`).join("");
  sec.style.display="";
  if(window.instgrm)window.instgrm.Embeds.process();else{const s=document.createElement("script");s.async=true;s.src="https://www.instagram.com/embed.js";document.body.appendChild(s)}
}
loadInsta();
document.querySelectorAll("#lang button").forEach(b=>b.addEventListener("click",()=>setTimeout(loadInsta,0)));

/* ---------- booking ---------- */
window.initBooking=function(){
  const f=$("#bkForm");
  $("#bkSvc").innerHTML=SVC.map(s=>`<option value="${s}">${t("svc_"+s)}</option>`).join("");
  const times=[];for(let h=8;h<=21;h++)for(const m of["00","30"])times.push(String(h).padStart(2,"0")+":"+m);
  $("#bkTime").innerHTML=times.map(x=>`<option>${x}</option>`).join("");
  const d=f.querySelector("[name=date]");d.min=new Date().toISOString().slice(0,10);if(!d.value)d.value=d.min;
  if(ME){const E=f.elements;E.name.value=E.name.value||ME.user.name;E.phone.value=E.phone.value||ME.user.phone}
  f.onsubmit=async e=>{e.preventDefault();const b=fd(f);try{const r=await call("/api/bookings",{method:"POST",body:b});const wu=waURL(`${t("hero_cta4")} #${r.id}\n${b.name} — ${b.date} ${b.time}\n${t("svc_"+b.service)}${b.vehicle?"\n"+b.vehicle:""}`);
    const m=$("#bkMsg");m.className="msg ok";m.innerHTML=`${esc(t("bk_ok"))}<br><a class="btn wa" style="margin-top:10px" target="_blank" rel="noopener" href="${wu}">${esc(t("bk_wa"))}</a>`;
    try{window.open(wu,"_blank")}catch(_){}}catch(er){msg($("#bkMsg"),0,errT(er.message))}};
};

loadMe();
document.querySelectorAll("#lang button").forEach(b=>b.addEventListener("click",()=>{const h=location.hash;
  if(h.startsWith("#/account"))renderAccount();if(h.startsWith("#/car")){$("#mkSel").dataset.l="";initCar()}if(h.startsWith("#/booking"))initBooking()}));
})();
