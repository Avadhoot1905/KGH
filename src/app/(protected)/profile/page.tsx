import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/actions/auth";
import { getRecentOrders, getRecentlyViewedProducts } from "@/actions/profile";
import styles from "@app/components1/profile.module.css";
import ProfileToggleClient from "../../components1/profileToggleClient";

export default async function ProfilePage() {
  const [user, recentOrders, viewed] = await Promise.all([
    getCurrentUser(),
    getRecentOrders(),
    getRecentlyViewedProducts(8),
  ]);

  return (
    <div className={styles.container}>
      <section className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrap}>
            {user?.image ? (
              <Image src={user.image} alt={user.name || "User"} width={64} height={64} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{user?.name?.[0] || user?.email?.[0] || "U"}</div>
            )}
          </div>
          <div className={styles.userMeta}>
            <h1 className={styles.userName}>{user?.name || "Your Profile"}</h1>
            <p className={styles.userEmail}>{user?.email}</p>
            <p className={styles.userSince}>{user?.createdAt ? `Member since ${new Date(user.createdAt).toLocaleDateString()}` : null}</p>
          </div>
          <div className={styles.actions}>
            <ProfileToggleClient initialTab="orders" />
          </div>
        </div>
        <div className={styles.profileDetails}>
          {user?.phoneNumber ? <div><span>Phone:</span> {user.phoneNumber}</div> : null}
          {user?.contact ? <div><span>Contact:</span> {user.contact}</div> : null}
        </div>
      </section>

      <section className={styles.contentSection}>
        {/* Orders and Viewed sections are both rendered; client toggles visibility */}
        <div id="orders-section" className={styles.sectionPane}>
          <div className={styles.sectionHeader}>
            <h2>Recent Orders</h2>
          </div>
          {recentOrders.length === 0 ? (
            <div className={styles.emptyState}>No orders yet.</div>
          ) : (
            <ul className={styles.orderList}>
              {recentOrders.map((o) => (
                <li key={o.id} className={styles.orderItem}>
                  <div className={styles.orderMeta}>
                    <div>
                      <strong>Order #{o.id.slice(-6).toUpperCase()}</strong>
                    </div>
                    <div>{o.createdAt}</div>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderStatus}>{o.status}</span>
                    <span className={styles.orderTotal}>{o.total}</span>
                    <span className={styles.orderItems}>{o.items} items</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="viewed-section" className={`${styles.sectionPane} ${styles.hidden}`}>
          <div className={styles.sectionHeader}>
            <h2>Recently Viewed</h2>
            <Link href="/Shop" className={styles.link}>Browse more</Link>
          </div>
          {viewed.length === 0 ? (
            <div className={styles.emptyState}>No recently viewed products.</div>
          ) : (
            <div className={styles.grid}>
              {viewed.map((p) => (
                <Link key={p.id} href={`/ProductDetail/${p.id}`} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt={p.name} className={styles.cardImage} />
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTitle}>{p.name}</div>
                    <div className={styles.cardPrice}>{p.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


