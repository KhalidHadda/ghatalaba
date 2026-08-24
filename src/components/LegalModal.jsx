import { X, Shield, FileText } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function LegalModal({ type, onClose }) {
  const { lang, t } = useLanguage()

  const isPrivacy = type === 'privacy'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(6, 13, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1.5rem',
      direction: lang === 'ar' ? 'rtl' : 'ltr',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <div style={{
        background: '#0F172A',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        maxWidth: 680,
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isPrivacy ? <Shield size={20} color="#06B6D4" /> : <FileText size={20} color="#06B6D4" />}
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              {isPrivacy ? t('privacyPolicy') : t('termsOfService')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          fontSize: 14,
          color: '#CBD5E1',
          lineHeight: 1.7,
        }}>
          {isPrivacy ? (
            /* Privacy Policy Content */
            <div>
              {lang === 'fr' ? (
                <div>
                  <p style={{ marginTop: 0 }}><strong>Dernière mise à jour : Août 2026</strong></p>
                  <p>Bienvenue sur <strong>Gha Talaba</strong>. Nous accordons une importance capitale à la confidentialité et à la protection des données personnelles de notre communauté étudiante.</p>
                  
                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>1. Informations Collectées</h3>
                  <p>Nous collectons uniquement les informations nécessaires au bon fonctionnement des services :</p>
                  <ul>
                    <li>Informations de compte : Nom d'utilisateur, adresse e-mail académique ou personnelle.</li>
                    <li>Publications & Annonces : Les contenus que vous publiez sur le logement, le marché, le covoiturage ou le forum.</li>
                    <li>Messagerie : Les messages échangés entre utilisateurs pour faciliter les transactions de gré à gré.</li>
                  </ul>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>2. Utilisation des Données</h3>
                  <p>Vos données sont exclusivement utilisées pour :</p>
                  <ul>
                    <li>Permettre la mise en relation directe entre étudiants.</li>
                    <li>Sécuriser la plateforme et prévenir les spams ou abus.</li>
                    <li>Conserver vos préférences linguistiques et de compte.</li>
                  </ul>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>3. Partage et Confidentialité</h3>
                  <p>Nous ne vendons, ne louons et ne partageons aucune donnée personnelle à des tiers à des fins commerciales.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>4. Vos Droits</h3>
                  <p>Vous conservez un droit d'accès, de modification et de suppression de vos données personnelles à tout moment depuis les paramètres de votre compte.</p>
                </div>
              ) : lang === 'ar' ? (
                <div>
                  <p style={{ marginTop: 0 }}><strong>آخر تحديث: غشت 2026</strong></p>
                  <p>مرحباً بكم في منصة <strong>Gha Talaba</strong>. نحن نولي أهمية قصوى لخصوصية وحماية البيانات الشخصية لمجتمعنا الطلابي.</p>
                  
                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>1. البيانات التي نجمعها</h3>
                  <p>نجمع فقط البيانات الضرورية لتقديم خدمات المنصة بشكل آمن:</p>
                  <ul>
                    <li>معلومات الحساب: اسم المستخدم، البريد الإلكتروني.</li>
                    <li>المحتوى المنشور: الإعلانات المنشورة بخصوص السكن، المستلزمات، مشاركة الرحلات، أو المنتدى.</li>
                    <li>المراسلات: الرسائل المتبادلة بين الطلاب للتواصل المباشر.</li>
                  </ul>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>2. كيف نستخدم بياناتك</h3>
                  <p>تستخدم بياناتك حصرياً لأغراض تشغيل المنصة:</p>
                  <ul>
                    <li>تسهيل التواصل المباشر بين الطلاب.</li>
                    <li>تأمين المنصة ومنع السلوكيات غير المرغوب فيها.</li>
                  </ul>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>3. حماية البيانات</h3>
                  <p>نحن لا نبيع ولا نؤجر بياناتك الشخصية لأي جهة تجارية خارجية.</p>
                </div>
              ) : (
                <div>
                  <p style={{ marginTop: 0 }}><strong>Last Updated: August 2026</strong></p>
                  <p>Welcome to <strong>Gha Talaba</strong>. Protecting your privacy and personal data is a foundational priority for our student platform.</p>
                  
                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>1. Information We Collect</h3>
                  <p>We only collect essential information required to operate the platform securely:</p>
                  <ul>
                    <li><strong>Account Information:</strong> Username and student or personal email address.</li>
                    <li><strong>Listings & Content:</strong> Housing announcements, marketplace items, rideshares, and campus posts created by you.</li>
                    <li><strong>Messages:</strong> Direct peer-to-peer communications initiated on the network.</li>
                  </ul>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>2. How We Use Your Data</h3>
                  <p>Your data is strictly used to facilitate peer-to-peer student connections, housing search, and campus community engagement.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>3. Data Protection & Sharing</h3>
                  <p>We do not sell, rent, or trade your personal information to third-party advertisers or data brokers.</p>
                </div>
              )}
            </div>
          ) : (
            /* Terms of Service Content */
            <div>
              {lang === 'fr' ? (
                <div>
                  <p style={{ marginTop: 0 }}><strong>Dernière mise à jour : Août 2026</strong></p>
                  <p>En utilisant <strong>Gha Talaba</strong>, vous acceptez les présentes Conditions d'Utilisation.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>1. Utilisation de la Plateforme</h3>
                  <p>Gha Talaba est une plateforme communautaire destinée aux étudiants pour échanger des annonces de logement, du matériel, du covoiturage et des informations universitaires.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>2. Conduite des Utilisateurs</h3>
                  <p>Chaque utilisateur s'engage à publier des informations exactes et respectueuses. Tout contenu illégal, injurieux ou frauduleux sera supprimé immédiatement.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>3. Transactions Entre Pairs</h3>
                  <p>Gha Talaba facilite la mise en relation directe. Les utilisateurs effectuent leurs accords et échanges de gré à gré sous leur propre responsabilité.</p>
                </div>
              ) : lang === 'ar' ? (
                <div>
                  <p style={{ marginTop: 0 }}><strong>آخر تحديث: غشت 2026</strong></p>
                  <p>باستخدام منصة <strong>Gha Talaba</strong>، فإنك توافق على شروط الاستخدام التالية.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>1. استخدام المنصة</h3>
                  <p>منصة Gha Talaba مخصصة لتسهيل التواصل والتبادل بين الطلاب فيما يخص السكن، الأدوات، مشاركة الرحلات، والنقاشات الطلابية.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>2. قواعد السلوك</h3>
                  <p>يلتزم كل مستخدم بنشر معلومات صحيحة وتحري الاحترام المتبادل. يمنع نشر أي محتوى مسيء أو غير قانوني.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>3. المعاملات بين الطلاب</h3>
                  <p>تسهل المنصة التواصل المباشر بين الطلاب وتتم التوافقات والمعاملات تحت مسؤولية الأطراف المعنية.</p>
                </div>
              ) : (
                <div>
                  <p style={{ marginTop: 0 }}><strong>Last Updated: August 2026</strong></p>
                  <p>By accessing or using <strong>Gha Talaba</strong>, you agree to be bound by these Terms of Service.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>1. Platform Purpose</h3>
                  <p>Gha Talaba provides a peer-to-peer community network connecting students for housing, campus marketplace, inter-city mobility, and academic discussion.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>2. Community Standards</h3>
                  <p>Users must publish authentic listings and maintain respectful interactions. Fraudulent, abusive, or harmful behavior will result in account suspension.</p>

                  <h3 style={{ color: '#FFF', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>3. Direct Peer Agreements</h3>
                  <p>Transactions and rideshare arrangements take place directly between students. Users are encouraged to communicate clearly and follow standard safety practices.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(15, 23, 42, 0.95)',
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#06B6D4',
              color: '#060D19',
              border: 'none',
              borderRadius: 10,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {lang === 'fr' ? 'Fermer' : lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
