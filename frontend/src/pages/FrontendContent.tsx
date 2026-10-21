import {useEffect,useState} from "react";
import {useLocation,Link} from "react-router-dom";
import {api} from "../services/api";
import {Settings,LayoutList,Sparkles,Star,HelpCircle,MessageSquare,Plus,Pencil,Trash2,Power,Save,ArrowLeft} from "lucide-react";
type Item={_id?:string;name?:string;title?:string;description?:string;designation?:string;image?:string;icon?:string;question?:string;answer?:string;sectionName?:string;isActive?:boolean;sortOrder?:number;[k:string]:any};
const configs:any={"frontend-settings":{title:"Frontend Setting",collection:"frontend-settings",fields:[]},"frontend-sections":{title:"Frontend Section",collection:"frontend-sections",fields:[['sectionName','Section Name'],['title','Title'],['description','Description'],['image','Image URL']],tableFields:[['sectionName','Section Name'],['title','Title'],['image','Image']]},features:{title:"Features Section",collection:"features",fields:[['image','Image URL'],['icon','Icon name'],['title','Title'],['description','Description']],tableFields:[['image','Image'],['icon','Icon'],['title','Title']]},"best-features":{title:"Best Features Section",collection:"best-features",fields:[['name','Name'],['title','Title'],['image','Image URL']],tableFields:[['image','Image'],['name','Name'],['title','Title']]},faq:{title:"Faq Section",collection:"faq",fields:[['question','Title'],['answer','Description']],tableFields:[['question','Title'],['answer','Description']]},testimonials:{title:"Testimonial",collection:"testimonials",fields:[['name','Name'],['image','Image URL'],['designation','Designation'],['description','Testimonial']],tableFields:[['name','Name'],['image','Image'],['designation','Designation']]}};
const links=[['/admin/setting/frontend-setting','frontend-settings','Frontend Setting',Settings],['/admin/setting/frontend-setting/section-setting','frontend-sections','Section Setting',LayoutList],['/admin/setting/frontend-setting/features','features','Features',Sparkles],['/admin/setting/frontend-setting/best-features','best-features','Best Features',Star],['/admin/setting/frontend-setting/faq','faq','Faq',HelpCircle],['/admin/setting/frontend-setting/testimonial','testimonials','Testimonial',MessageSquare]] as const;
export default function FrontendContent(){const loc=useLocation();const tabFromPath=(()=>{const p=loc.pathname.replace(/\/+$/,'');const routes:Record<string,string>={'/admin/setting/frontend-setting/section-setting':'frontend-sections','/admin/setting/frontend-setting/features':'features','/admin/setting/frontend-setting/best-features':'best-features','/admin/setting/frontend-setting/faq':'faq','/admin/setting/frontend-setting/testimonial':'testimonials','/admin/setting/frontend-setting':'frontend-settings','/admin/frontend-setting/section-setting':'frontend-sections','/admin/frontend-setting/features':'features','/admin/frontend-setting/best-features':'best-features','/admin/frontend-setting/faq/faq':'faq','/admin/frontend-setting/testimonial/testimonial':'testimonials'};return routes[p]||'frontend-settings'})();const key=tabFromPath;const cfg=configs[key]||configs['frontend-settings'];const [items,setItems]=useState<Item[]>([]);const [settings,setSettings]=useState<Item>({activeStatus:true,registrationActive:true});const [edit,setEdit]=useState<Item|null>(null);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [loading,setLoading]=useState(false);const [isNew,setIsNew]=useState(false);const [search,setSearch]=useState('');
async function load(){setLoading(true);setError('');try{if(key==='frontend-settings'){const r=await api<{item:Item}>(`/admin/content/${key}`);setSettings(r.item)}else{const r=await api<{items:Item[]}>(`/admin/content/${key}`);setItems(r.items||[])}}catch(e){setError(e instanceof Error?e.message:'Could not load content')}finally{setLoading(false)}}useEffect(()=>{void load();setEdit(null);setNotice('')},[key]);
function start(item?:Item){setIsNew(!item);setEdit(item?{...item}:{isActive:true,sortOrder:items.length});setError('');setNotice('')}
async function save(e:React.FormEvent){e.preventDefault();if(!edit)return;setError('');try{if(isNew){await api(`/admin/content/${key}`,{method:'POST',body:JSON.stringify(edit)})}else if(edit._id){await api(`/admin/content/${key}/${edit._id}`,{method:'PUT',body:JSON.stringify(edit)})}setEdit(null);setNotice('Saved successfully.');await load()}catch(e){setError(e instanceof Error?e.message:'Save failed')}}
async function saveSettings(e:React.FormEvent){e.preventDefault();setError('');setNotice('');try{const r=await api<{item:Item;message:string}>(`/admin/content/${key}`,{method:'PUT',body:JSON.stringify(settings)});setSettings(r.item);setNotice(r.message||'Settings saved successfully')}catch(e){setError(e instanceof Error?e.message:'Save failed')}}
async function remove(item:Item){if(!item._id||!window.confirm('Delete this item permanently?'))return;try{await api(`/admin/content/${key}/${item._id}`,{method:'DELETE'});setNotice('Deleted successfully');await load()}catch(e){setError(e instanceof Error?e.message:'Delete failed')}}
async function toggle(item:Item){if(!item._id)return;try{await api(`/admin/content/${key}/${item._id}`,{method:'PUT',body:JSON.stringify({...item,isActive:item.isActive===false})});await load()}catch(e){setError(e instanceof Error?e.message:'Status update failed')}}
const val=(field:string)=>String((edit as any)?.[field]??'');const visibleItems=[...items].sort((a,b)=>Number(a.sortOrder??0)-Number(b.sortOrder??0)).filter(item=>[item.sectionName,item.name,item.title,item.description,item.question,item.answer].some(value=>String(value||'').toLowerCase().includes(search.toLowerCase())));const setVal=(field:string,value:any)=>setEdit(v=>v?({...v,[field]:value}):v);
return (
  <div className="fc-wrap">
    <h1>{cfg.title}</h1>
    <div className="fc-layout">
      <aside className="fc-sidebar">
        {links.map(([href, tab, label, Icon]) => (
          <Link key={tab} to={href} className={key === tab ? "active" : ""}>
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        ))}
      </aside>
      <main className="fc-main">
        <div className="fc-head">
          <h2>{edit ? `${isNew ? "Add" : "Edit"} ${cfg.title}` : cfg.title}</h2>
          {key !== "frontend-settings" && key !== "frontend-sections" && !edit && (
            <button type="button" className="fc-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={() => start()}>
              <Plus size={15} /> Add {key === "faq" ? "FAQ" : key === "testimonials" ? "Testimonial" : key === "features" ? "Feature" : key === "best-features" ? "Best Feature" : "Section"}
            </button>
          )}
        </div>
        {error && <p className="fc-error">{error}</p>}
        {notice && <p className="fc-notice">{notice}</p>}
        {loading && <p>Loading…</p>}

        {key === "frontend-settings" && !edit && (
          <form className="fc-form" onSubmit={saveSettings}>
            <label>Active Status
              <select value={settings.activeStatus === false ? "false" : "true"} onChange={e => setSettings(v => ({ ...v, activeStatus: e.target.value === "true" }))}>
                <option value="true">Enable</option><option value="false">Disable</option>
              </select>
            </label>
            <label>Registration Active
              <select value={settings.registrationActive === false ? "false" : "true"} onChange={e => setSettings(v => ({ ...v, registrationActive: e.target.value === "true" }))}>
                <option value="true">Enable</option><option value="false">Disable</option>
              </select>
            </label>
            {[["metaKeyword", "Meta Keyword"], ["metaAuthor", "Meta Author"], ["metaDescription", "Meta Description"], ["facebookLink", "Facebook link"], ["twitterLink", "Twitter Link"], ["linkedinLink", "LinkedIn link"], ["skypeLink", "Skype Link"]].map(([field, label]) => (
              <label key={field}>{label}
                {field === "metaDescription" ? <textarea rows={3} value={String(settings[field] || "")} onChange={e => setSettings(v => ({ ...v, [field]: e.target.value }))} /> : <input value={String(settings[field] || "")} onChange={e => setSettings(v => ({ ...v, [field]: e.target.value }))} />}
              </label>
            ))}
            <div className="fc-form-actions"><button className="fc-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit"><Save size={15} /> Update</button></div>
          </form>
        )}

        {key !== "frontend-settings" && edit && (
          <form className="fc-edit-form" onSubmit={save}>
            <div className="fc-fields">
              {cfg.fields.map(([field, label]) => (
                <label key={field}>{label}
                  {field === "description" || field === "answer" ? <textarea rows={4} required={field === "answer"} value={val(field)} onChange={e => setVal(field, e.target.value)} /> : <input required={["title", "name", "question", "sectionName"].includes(field)} type={field === "image" ? "url" : "text"} placeholder={field === "image" ? "https://example.com/image.png" : `Enter ${label.toLowerCase()}`} value={val(field)} onChange={e => setVal(field, e.target.value)} />}
                  {field === "image" && val("image") && <img className="fc-image-preview" src={val("image")} alt="Preview" onError={e => { e.currentTarget.style.display = "none"; }} />}
                </label>
              ))}
              <label>Display order<input type="number" value={val("sortOrder")} onChange={e => setVal("sortOrder", Number(e.target.value))} /></label>
              <label>Status<select value={edit.isActive === false ? "false" : "true"} onChange={e => setVal("isActive", e.target.value === "true")}><option value="true">Active</option><option value="false">Inactive</option></select></label>
            </div>
            <div className="fc-form-actions"><button type="button" className="fc-secondary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={() => setEdit(null)}>Cancel</button><button className="fc-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit"><Save size={15} /> Save</button></div>
          </form>
        )}

        {key !== "frontend-settings" && !edit && (
          <>
            <div className="fc-list-tools">
              <span>{items.length} {key === "best-features" ? "best features" : "items"}</span>
              <input aria-label="Search entries" type="search" placeholder={`Search ${cfg.title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="fc-table-wrap">
              <table>
                <thead><tr><th>SL</th>{(cfg.tableFields || cfg.fields).map(([field, label]) => <th key={field}>{label.replace(" URL", "")}</th>)}<th>Status</th><th>Action</th></tr></thead>
                <tbody>{visibleItems.map((item, index) => <tr key={item._id || `${item.title || item.name || "item"}-${index}`}>
                  <td>{index + 1}</td>
                  {(cfg.tableFields || cfg.fields).map(([field]) => <td key={field}>{field === "image" && item[field] ? <img className="fc-thumb" src={item[field]} alt={item.sectionName || "Section image"} onError={e => { e.currentTarget.style.display = "none"; }} /> : String(item[field] ?? "—")}</td>)}
                  <td><button type="button" className={`fc-status ${item.isActive === false ? "inactive" : ""} bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`} onClick={() => void toggle(item)}>{item.isActive === false ? "Inactive" : "Active"}</button></td>
                  <td><button type="button" className="fc-icon-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" title="Edit" onClick={() => start(item)}><Pencil size={15} /></button><button type="button" className="fc-icon-btn danger bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" title="Delete" onClick={() => void remove(item)}><Trash2 size={15} /></button></td>
                </tr>)}</tbody>
              </table>
              {!visibleItems.length && !loading && <div className="fc-empty">{search ? `No ${cfg.title.toLowerCase()} match your search.` : "No entries yet. Click Add to create the first one."}</div>}
            </div>
          </>
        )}
      </main>
    </div>
  </div>
);
}
