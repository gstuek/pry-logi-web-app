import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

interface DataTablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function DataTablePagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: DataTablePaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="text-sm text-muted-foreground">
        {t('common.page')} {currentPage} {t('common.of')} {totalPages} ({totalItems}{' '}
        {t('common.rowsPerPage').toLowerCase()})
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <CaretLeft size={16} className="mr-1" />
          {t('common.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {t('common.next')}
          <CaretRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
