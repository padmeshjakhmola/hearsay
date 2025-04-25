CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" varchar(255) DEFAULT 'nil',
	"full_name" varchar(255) DEFAULT 'whatsapp_user',
	"type" varchar(20) DEFAULT 'nil',
	"file" varchar(255) DEFAULT 'nil',
	"mobile_number" varchar(255) DEFAULT '0000',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_id_unique" UNIQUE("id")
);
