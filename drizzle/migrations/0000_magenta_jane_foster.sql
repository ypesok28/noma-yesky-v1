CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_fname" varchar(255) NOT NULL,
	"user_lname" varchar(255) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	CONSTRAINT "users_user_email_unique" UNIQUE("user_email")
);
