import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  restaurants, InsertRestaurant, Restaurant,
  siteEvaluations, InsertSiteEvaluation, SiteEvaluation,
  scoringConfigs, InsertScoringConfig, ScoringConfig,
  financialCalculations, InsertFinancialCalculation, FinancialCalculation
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Restaurant Functions ============
export async function createRestaurant(data: InsertRestaurant): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(restaurants).values(data);
  return result[0].insertId;
}

export async function getRestaurantsByUser(userId: number): Promise<Restaurant[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurants).where(eq(restaurants.userId, userId)).orderBy(desc(restaurants.createdAt));
}

export async function getRestaurantById(id: number, userId: number): Promise<Restaurant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(and(eq(restaurants.id, id), eq(restaurants.userId, userId))).limit(1);
  return result[0];
}

export async function updateRestaurant(id: number, userId: number, data: Partial<InsertRestaurant>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(restaurants).set(data).where(and(eq(restaurants.id, id), eq(restaurants.userId, userId)));
}

export async function deleteRestaurant(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(restaurants).where(and(eq(restaurants.id, id), eq(restaurants.userId, userId)));
}

// ============ Site Evaluation Functions ============
export async function createSiteEvaluation(data: InsertSiteEvaluation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(siteEvaluations).values(data);
  return result[0].insertId;
}

export async function getSiteEvaluationsByUser(userId: number): Promise<SiteEvaluation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteEvaluations).where(eq(siteEvaluations.userId, userId)).orderBy(desc(siteEvaluations.createdAt));
}

export async function getSiteEvaluationById(id: number, userId: number): Promise<SiteEvaluation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteEvaluations).where(and(eq(siteEvaluations.id, id), eq(siteEvaluations.userId, userId))).limit(1);
  return result[0];
}

export async function updateSiteEvaluation(id: number, userId: number, data: Partial<InsertSiteEvaluation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(siteEvaluations).set(data).where(and(eq(siteEvaluations.id, id), eq(siteEvaluations.userId, userId)));
}

export async function deleteSiteEvaluation(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(siteEvaluations).where(and(eq(siteEvaluations.id, id), eq(siteEvaluations.userId, userId)));
}

export async function getSiteEvaluationsByRestaurant(restaurantId: number, userId: number): Promise<SiteEvaluation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteEvaluations)
    .where(and(eq(siteEvaluations.restaurantId, restaurantId), eq(siteEvaluations.userId, userId)))
    .orderBy(desc(siteEvaluations.createdAt));
}

// ============ Scoring Config Functions ============
export async function createScoringConfig(data: InsertScoringConfig): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scoringConfigs).values(data);
  return result[0].insertId;
}

export async function getScoringConfigsByUser(userId: number): Promise<ScoringConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scoringConfigs).where(eq(scoringConfigs.userId, userId)).orderBy(desc(scoringConfigs.createdAt));
}

export async function getDefaultScoringConfig(userId: number, businessModel: string): Promise<ScoringConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scoringConfigs)
    .where(and(
      eq(scoringConfigs.userId, userId),
      eq(scoringConfigs.businessModel, businessModel),
      eq(scoringConfigs.isDefault, 1)
    )).limit(1);
  return result[0];
}

export async function updateScoringConfig(id: number, userId: number, data: Partial<InsertScoringConfig>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scoringConfigs).set(data).where(and(eq(scoringConfigs.id, id), eq(scoringConfigs.userId, userId)));
}

// ============ Financial Calculation Functions ============
export async function createFinancialCalculation(data: InsertFinancialCalculation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(financialCalculations).values(data);
  return result[0].insertId;
}

export async function getFinancialCalculationByEvaluation(evaluationId: number): Promise<FinancialCalculation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(financialCalculations).where(eq(financialCalculations.evaluationId, evaluationId)).limit(1);
  return result[0];
}
