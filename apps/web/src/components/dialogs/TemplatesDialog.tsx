import { useMemo } from "react";
import { LayoutList, File as FileIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getMemoTemplates, type MemoTemplate } from "@/lib/app-helpers";

export const TemplatesDialog = ({
  canCreateMemo,
  isCreating,
  onClose,
  onCreateMemo,
}: {
  canCreateMemo: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreateMemo: (template: MemoTemplate) => void;
}) => {
  const { t } = useTranslation();
  const memoTemplates = useMemo(() => getMemoTemplates(t), [t]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !isCreating) onClose(); }}>
      <DialogContent className="max-w-[620px] p-0 overflow-hidden border border-slate-200 bg-white shadow-lg rounded-lg">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <LayoutList className="h-4 w-4 text-emerald-700" />
              {t("templates.title")}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500">
              {t("templates.description")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {memoTemplates.map((template) => (
              <button
                key={template.id}
                className="group flex min-h-28 flex-col rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                type="button"
                disabled={!canCreateMemo || isCreating}
                onClick={() => onCreateMemo(template)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-emerald-700 transition group-hover:border-slate-300">
                  <FileIcon className="h-4 w-4" />
                </span>
                <span className="mt-3 text-sm font-semibold text-slate-950">{template.title}</span>
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{template.description}</span>
              </button>
            ))}
          </div>
          {!canCreateMemo && (
            <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t("templates.unavailable")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
