import Image from "next/image";
import Link from "next/link";

import { useEffect, useState } from "react";

import { Brand, DataroomBrand } from "@prisma/client";

import { Button } from "@/components/ui/button";

import { determineTextColor } from "@/lib/utils/determine-text-color";

import AgreementSection from "./agreement-section";
import EmailSection from "./email-section";
import NameSection from "./name-section";
import PasswordSection from "./password-section";

export const DEFAULT_ACCESS_FORM_DATA = {
  email: null,
  password: null,
};

export type DEFAULT_ACCESS_FORM_TYPE = {
  email: string | null;
  password: string | null;
  hasConfirmedAgreement?: boolean;
  name?: string | null;
};

export default function AccessForm({
  data,
  email,
  brand,
  setData,
  onSubmitHandler,
  requireEmail,
  requirePassword,
  requireAgreement,
  agreementName,
  agreementContent,
  requireName,
  isLoading,
  linkId,
  disableEditEmail,
  useCustomAccessForm,
}: {
  data: DEFAULT_ACCESS_FORM_TYPE;
  email: string | null | undefined;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_ACCESS_FORM_TYPE>>;
  onSubmitHandler: React.FormEventHandler<HTMLFormElement>;
  brand?: Partial<Brand> | Partial<DataroomBrand> | null;
  requireEmail: boolean;
  requirePassword: boolean;
  requireAgreement?: boolean;
  agreementName?: string;
  agreementContent?: string;
  requireName?: boolean;
  isLoading: boolean;
  linkId?: string;
  disableEditEmail?: boolean;
  useCustomAccessForm?: boolean;
}) {
  const [isEmailValid, setIsEmailValid] = useState(true);

  useEffect(() => {
    const userEmail = email;
    if (userEmail) {
      setData((prevData: DEFAULT_ACCESS_FORM_TYPE) => ({
        ...prevData,
        email: userEmail || prevData.email,
      }));
    }
  }, [email]);

  const isFormValid = () => {
    if (requireEmail) {
      if (!data.email || !isEmailValid) return false;
    }
    if (requirePassword && !data.password) return false;
    if (requireAgreement && !data.hasConfirmedAgreement) return false;
    if (requireAgreement && requireName && !data.name) return false;
    return true;
  };

  return (
    <div
      className="flex h-dvh flex-col justify-between pb-4 pt-12"
      style={{
        backgroundColor:
          brand && brand.accentColor ? brand.accentColor : "black",
      }}
    >
      <div className="flex flex-1 flex-col px-6 lg:px-8">
        {/* <div className="bg-gray-950" style={{ backgroundColor: accentColor }}> */}

        {/* <div className="relative flex h-16 w-full flex-shrink-0 items-center justify-center">
          {brand && brand.logo ? (
            <Image
              className="object-contain"
              src={brand.logo}
              alt="Logo"
              fill
              quality={100}
              priority
            />
          ) : (
            <Link
              href={`https://www.papermark.io?utm_campaign=navbar&utm_medium=navbar&utm_source=papermark-${linkId}`}
              target="_blank"
              className="text-2xl font-bold tracking-tighter text-white"
            >
              Papermark
            </Link>
          )}
        </div> */}

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1
            className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white"
            style={{
              color:
                brand && brand.accentColor
                  ? determineTextColor(brand.accentColor)
                  : "white",
            }}
          >
            Your action is requested to continue
          </h1>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4" onSubmit={onSubmitHandler}>
            {requireAgreement && agreementContent && requireName ? (
              <NameSection {...{ data, setData, brand }} />
            ) : null}
            {requireEmail ? (
              <EmailSection
                {...{ data, setData, brand }}
                disableEditEmail={disableEditEmail}
                useCustomAccessForm={useCustomAccessForm}
                onValidationChange={setIsEmailValid}
              />
            ) : null}
            {requirePassword ? (
              <PasswordSection {...{ data, setData, brand }} />
            ) : null}
            {requireAgreement && agreementContent && agreementName ? (
              <AgreementSection
                {...{ data, setData, brand }}
                agreementContent={agreementContent}
                agreementName={agreementName}
                useCustomAccessForm={useCustomAccessForm}
              />
            ) : null}

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={!isFormValid()}
                className="w-1/3 min-w-fit bg-white text-gray-950 hover:bg-white/90"
                loading={isLoading}
                style={{
                  backgroundColor:
                    brand && brand.accentColor
                      ? determineTextColor(brand.accentColor)
                      : "white",

                  color:
                    brand && brand.accentColor ? brand.accentColor : "black",
                }}
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
      {!useCustomAccessForm ? (
        <div className="flex justify-center">
          <p className="text-sm leading-9 tracking-tight text-gray-500">
            <a href="/" target="_blank" rel="noopener noreferrer">
              This document is securely shared with you using{" "}
              <span className="font-semibold">Papermark</span>
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
